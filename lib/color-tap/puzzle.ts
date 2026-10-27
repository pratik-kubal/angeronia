// The puzzle file: JSON with its numbers packed into little-endian typed arrays in base64, so a
// Master puzzle (about 2,000 areas) is about a hundred kilobytes gzipped. Control points are stored
// at 1/8 px, each as the step from the one before. Shared by the build script (encode) and the game
// (decode).

import { isLevelId } from "./levels";
import type { Label, Puzzle, Region, Segment } from "./types";

export const FILE_FORMAT = 1;
/** Control points are stored in eighths of a px. */
const POINT_SCALE = 8;

type Kind = "u8" | "u16" | "i16" | "u32";
const BYTES: Record<Kind, number> = { u8: 1, u16: 2, i16: 2, u32: 4 };

function pack(kind: Kind, values: ArrayLike<number>): string {
  const bytes = new Uint8Array(values.length * BYTES[kind]);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (kind === "u8") view.setUint8(i, v);
    else if (kind === "u16") view.setUint16(i * 2, v, true);
    else if (kind === "i16") view.setInt16(i * 2, v, true);
    else view.setUint32(i * 4, v, true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function unpack(kind: Kind, text: unknown): number[] {
  if (typeof text !== "string") throw new Error("Puzzle file: expected packed numbers");
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const n = bytes.length / BYTES[kind];
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    out[i] = kind === "u8" ? view.getUint8(i) : kind === "u16" ? view.getUint16(i * 2, true) : kind === "i16" ? view.getInt16(i * 2, true) : view.getUint32(i * 4, true);
  }
  return out;
}

interface PuzzleFile {
  format: number;
  id: string;
  picture: string;
  level: string;
  width: number;
  height: number;
  palette: string[];
  regions: { colour: string; area: string; box: string; labelCount: string; labels: string; ringCount: string; ringLength: string; halves: string };
  segments: { left: string; right: string; closed: string; length: string; points: string };
}

/** The file's JSON. */
export function encodePuzzle(p: Puzzle): string {
  const labels: number[] = [];
  const ringCount: number[] = [];
  const ringLength: number[] = [];
  const halves: number[] = [];
  for (const r of p.regions) {
    for (const l of r.labels) labels.push(Math.round(l.x * POINT_SCALE), Math.round(l.y * POINT_SCALE), Math.round(l.r * POINT_SCALE));
    ringCount.push(r.rings.length);
    for (const ring of r.rings) {
      ringLength.push(ring.length);
      halves.push(...ring);
    }
  }
  const points: number[] = [];
  for (const s of p.segments) {
    let px = 0;
    let py = 0;
    for (let i = 0; i < s.points.length; i += 2) {
      const x = Math.round(s.points[i] * POINT_SCALE);
      const y = Math.round(s.points[i + 1] * POINT_SCALE);
      points.push(x - px, y - py);
      px = x;
      py = y;
    }
  }
  const file: PuzzleFile = {
    format: FILE_FORMAT,
    id: p.id,
    picture: p.picture,
    level: p.level,
    width: p.width,
    height: p.height,
    palette: p.palette,
    regions: {
      colour: pack("u8", p.regions.map((r) => r.colour)),
      area: pack("u32", p.regions.map((r) => r.area)),
      box: pack("u16", p.regions.flatMap((r) => r.box)),
      labelCount: pack("u8", p.regions.map((r) => r.labels.length)),
      labels: pack("u16", labels),
      ringCount: pack("u16", ringCount),
      ringLength: pack("u32", ringLength),
      halves: pack("u32", halves),
    },
    segments: {
      left: pack("i16", p.segments.map((s) => s.left)),
      right: pack("i16", p.segments.map((s) => s.right)),
      closed: pack("u8", p.segments.map((s) => (s.closed ? 1 : 0))),
      length: pack("u16", p.segments.map((s) => s.points.length / 2)),
      points: pack("i16", points),
    },
  };
  return JSON.stringify(file);
}

/** A puzzle from its file's parsed JSON; throws on anything that isn't one. */
export function decodePuzzle(value: unknown): Puzzle {
  const file = value as PuzzleFile;
  if (!file || typeof file !== "object" || file.format !== FILE_FORMAT) throw new Error("Puzzle file: unknown format");
  if (!isLevelId(file.level) || typeof file.id !== "string" || typeof file.picture !== "string") throw new Error("Puzzle file: bad header");
  if (!Array.isArray(file.palette) || !file.palette.every((c) => typeof c === "string" && /^#[0-9a-f]{6}$/.test(c))) throw new Error("Puzzle file: bad palette");

  const colour = unpack("u8", file.regions.colour);
  const area = unpack("u32", file.regions.area);
  const box = unpack("u16", file.regions.box);
  const labelCount = unpack("u8", file.regions.labelCount);
  const labels = unpack("u16", file.regions.labels);
  const ringCount = unpack("u16", file.regions.ringCount);
  const ringLength = unpack("u32", file.regions.ringLength);
  const halves = unpack("u32", file.regions.halves);
  let li = 0;
  let ri = 0;
  let hi = 0;
  const regions: Region[] = colour.map((c, i) => {
    const ls: Label[] = [];
    for (let j = 0; j < labelCount[i]; j++, li += 3) ls.push({ x: labels[li] / POINT_SCALE, y: labels[li + 1] / POINT_SCALE, r: labels[li + 2] / POINT_SCALE });
    const rings: number[][] = [];
    for (let j = 0; j < ringCount[i]; j++, ri++) {
      rings.push(halves.slice(hi, hi + ringLength[ri]));
      hi += ringLength[ri];
    }
    return { colour: c, area: area[i], box: [box[i * 4], box[i * 4 + 1], box[i * 4 + 2], box[i * 4 + 3]], labels: ls, rings };
  });

  const left = unpack("i16", file.segments.left);
  const right = unpack("i16", file.segments.right);
  const closed = unpack("u8", file.segments.closed);
  const length = unpack("u16", file.segments.length);
  const points = unpack("i16", file.segments.points);
  let pi = 0;
  const segments: Segment[] = left.map((l, i) => {
    const out = new Float32Array(length[i] * 2);
    let x = 0;
    let y = 0;
    for (let j = 0; j < length[i]; j++, pi += 2) {
      x += points[pi];
      y += points[pi + 1];
      out[j * 2] = x / POINT_SCALE;
      out[j * 2 + 1] = y / POINT_SCALE;
    }
    return { left: l, right: right[i], closed: closed[i] === 1, points: out };
  });
  for (const r of regions) {
    if (r.colour >= file.palette.length) throw new Error("Puzzle file: colour out of range");
    for (const ring of r.rings) for (const h of ring) if (h >> 1 >= segments.length) throw new Error("Puzzle file: segment out of range");
  }
  return { id: file.id, picture: file.picture, level: file.level, width: file.width, height: file.height, palette: file.palette, regions, segments };
}

/** The same puzzle as it reads back from its file: control points and labels at 1/8 px. */
export function roundTrip(p: Puzzle): Puzzle {
  return decodePuzzle(JSON.parse(encodePuzzle(p)));
}
