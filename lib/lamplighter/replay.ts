// A run, recorded: one byte of input per tick. Replaying the bytes through the simulation gives
// the same run, tick for tick, so a recording is all a ghost or a replay needs. A recording is
// only good for the route version and rules it was made with, so both are stamped on it.

import type { Compiled } from "./compiled";
import { createSim, quantizeSteer, step, type Input, type Sim } from "./sim";

/** Steer in 1/63 steps in the low 7 bits (0 = full left, 126 = full right), hop in the top bit. */
export const pack = (input: Input) => (Math.round(quantizeSteer(input.steer) * 63) + 63) | (input.hop ? 128 : 0);
export const unpack = (byte: number): Input => ({ steer: ((byte & 127) - 63) / 63, hop: (byte & 128) !== 0 });

export class InputLog {
  private buf = new Uint8Array(4096);
  private n = 0;

  get length() {
    return this.n;
  }

  push(byte: number) {
    if (this.n === this.buf.length) {
      const grown = new Uint8Array(this.buf.length * 2);
      grown.set(this.buf);
      this.buf = grown;
    }
    this.buf[this.n++] = byte;
  }

  /** Forgets every tick from `tick` on: "Retry from the last lamp" keeps a recording one clean run. */
  truncate(tick: number) {
    this.n = Math.max(0, Math.min(this.n, tick));
  }

  bytes(): Uint8Array {
    return this.buf.slice(0, this.n);
  }
}

/** Runs a recording from the start. */
export function replay(route: Compiled, log: Uint8Array): Sim {
  const sim = createSim(route);
  for (let i = 0; i < log.length; i++) step(sim, unpack(log[i]), route);
  return sim;
}

export type RunRecord = { routeId: string; routeVersion: number; simVersion: number; log: string };

/** A recording as text: runs of equal bytes as (count, byte) pairs, in base64. */
export function encode(log: Uint8Array): string {
  const out: number[] = [];
  for (let i = 0; i < log.length; ) {
    let j = i + 1;
    while (j < log.length && log[j] === log[i] && j - i < 255) j++;
    out.push(j - i, log[i]);
    i = j;
  }
  let bin = "";
  for (const b of out) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decode(text: string): Uint8Array {
  const bin = atob(text);
  const out: number[] = [];
  for (let i = 0; i + 1 < bin.length; i += 2) {
    const count = bin.charCodeAt(i);
    const byte = bin.charCodeAt(i + 1);
    for (let k = 0; k < count; k++) out.push(byte);
  }
  return Uint8Array.from(out);
}
