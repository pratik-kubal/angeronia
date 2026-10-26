// Every picture in the race, drawn by code into one atlas when a race starts: glows, sparks, Wick's
// three wing beats, the pickups and hazards, the lamps and the lantern, the scenery. No image files
// (DECISIONS.md ADR-022). The atlas is drawn once; a frame only copies from it.

export type SpriteName =
  | "glow"
  | "cool"
  | "spark"
  | "big"
  | "wick0"
  | "wick1"
  | "wick2"
  | "blossom"
  | "dew"
  | "drop"
  | "shadow"
  | "bat0"
  | "bat1"
  | "lampOff"
  | "lampOn"
  | "lanternOff"
  | "lanternOn"
  | "tree"
  | "cottage"
  | "windmill"
  | "blades"
  | "belfry"
  | "moon";

/** Where a sprite sits in the atlas (atlas pixels) and its size in CSS pixels at scale 1. */
export type Cell = { x: number; y: number; w: number; h: number };

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

/** The atlas is drawn at this many pixels per sprite unit. */
const SCALE = 1.5;
const ATLAS_W = 1024;

function radial(g: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][]) {
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
}

function wick(beat: number): Painter {
  return (g, w, h) => {
    const cx = w / 2;
    // Wings: two pairs, translucent, raised by the beat.
    const lift = [-0.55, -0.15, 0.25][beat];
    g.fillStyle = "rgba(220, 230, 255, 0.55)";
    for (const side of [-1, 1]) {
      for (const [len, wid, tilt] of [
        [0.34, 0.12, 0],
        [0.26, 0.09, 0.35],
      ] as const) {
        g.save();
        g.translate(cx + side * w * 0.06, h * 0.42);
        g.rotate(side * (Math.PI / 2 - lift - tilt));
        g.beginPath();
        g.ellipse(0, -h * len * 0.5, w * wid, h * len * 0.5, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
    // Body: head, thorax, and the lantern of an abdomen.
    g.fillStyle = "#1d1a2e";
    g.beginPath();
    g.ellipse(cx, h * 0.3, w * 0.07, h * 0.06, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(cx, h * 0.43, w * 0.1, h * 0.1, 0, 0, Math.PI * 2);
    g.fill();
    const glow = g.createRadialGradient(cx, h * 0.66, 0, cx, h * 0.66, w * 0.16);
    glow.addColorStop(0, "#fffbe0");
    glow.addColorStop(0.5, "#ffe46b");
    glow.addColorStop(1, "#d9b02b");
    g.fillStyle = glow;
    g.beginPath();
    g.ellipse(cx, h * 0.64, w * 0.12, h * 0.16, 0, 0, Math.PI * 2);
    g.fill();
    // Antennae.
    g.strokeStyle = "#1d1a2e";
    g.lineWidth = w * 0.02;
    g.lineCap = "round";
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + side * w * 0.03, h * 0.26);
      g.quadraticCurveTo(cx + side * w * 0.12, h * 0.12, cx + side * w * 0.17, h * 0.1);
      g.stroke();
    }
  };
}

function lantern(lit: boolean, big: boolean): Painter {
  return (g, w, h) => {
    const cx = w / 2;
    const frame = "#2a2440";
    // Hanger and cap.
    g.strokeStyle = frame;
    g.lineWidth = w * 0.05;
    g.beginPath();
    g.arc(cx, h * 0.1, w * 0.12, Math.PI, 0);
    g.stroke();
    g.fillStyle = frame;
    g.beginPath();
    g.moveTo(cx - w * 0.36, h * 0.24);
    g.lineTo(cx, h * 0.1);
    g.lineTo(cx + w * 0.36, h * 0.24);
    g.closePath();
    g.fill();
    // Glass.
    const glass = g.createLinearGradient(0, h * 0.24, 0, h * 0.84);
    if (lit) {
      glass.addColorStop(0, "#fff3c0");
      glass.addColorStop(0.5, "#ffd45a");
      glass.addColorStop(1, "#f0a83a");
    } else {
      glass.addColorStop(0, "#3a3f66");
      glass.addColorStop(1, "#262a4a");
    }
    g.fillStyle = glass;
    g.fillRect(cx - w * 0.28, h * 0.24, w * 0.56, h * 0.6);
    // Panes.
    g.strokeStyle = frame;
    g.lineWidth = w * (big ? 0.04 : 0.06);
    g.strokeRect(cx - w * 0.28, h * 0.24, w * 0.56, h * 0.6);
    g.beginPath();
    g.moveTo(cx, h * 0.24);
    g.lineTo(cx, h * 0.84);
    g.stroke();
    if (!lit) {
      // An unlit wick waiting inside.
      g.fillStyle = "#6b6f99";
      g.fillRect(cx - w * 0.03, h * 0.6, w * 0.06, h * 0.1);
    }
    // Base.
    g.fillStyle = frame;
    g.fillRect(cx - w * 0.34, h * 0.84, w * 0.68, h * 0.08);
  };
}

// A shade above the night's ground, so the scenery reads as shapes against it.
const SILHOUETTE = "#18205a";
const SILHOUETTE_EDGE = "#2a3577";

const PAINTERS: Record<SpriteName, [number, number, Painter]> = {
  glow: [128, 128, (g, w, h) => radial(g, w, h, [[0, "rgba(255,248,214,1)"], [0.14, "rgba(255,226,122,0.85)"], [0.4, "rgba(255,200,80,0.28)"], [1, "rgba(255,190,70,0)"]])],
  cool: [128, 128, (g, w, h) => radial(g, w, h, [[0, "rgba(235,242,255,0.9)"], [0.25, "rgba(170,195,255,0.4)"], [1, "rgba(150,180,255,0)"]])],
  spark: [48, 48, (g, w, h) => {
    radial(g, w, h, [[0, "rgba(255,250,215,1)"], [0.25, "rgba(255,215,100,0.85)"], [0.6, "rgba(255,190,70,0.2)"], [1, "rgba(255,190,70,0)"]]);
    g.fillStyle = "rgba(255,240,190,0.95)";
    g.beginPath();
    g.moveTo(w / 2, 0);
    g.quadraticCurveTo(w / 2, h / 2, w, h / 2);
    g.quadraticCurveTo(w / 2, h / 2, w / 2, h);
    g.quadraticCurveTo(w / 2, h / 2, 0, h / 2);
    g.quadraticCurveTo(w / 2, h / 2, w / 2, 0);
    g.fill();
  }],
  big: [72, 72, (g, w, h) => {
    radial(g, w, h, [[0, "rgba(255,255,245,1)"], [0.2, "rgba(255,225,120,0.95)"], [0.55, "rgba(255,180,70,0.35)"], [1, "rgba(255,170,60,0)"]]);
    g.fillStyle = "rgba(255,255,240,0.95)";
    for (const turn of [0, Math.PI / 4]) {
      g.save();
      g.translate(w / 2, h / 2);
      g.rotate(turn);
      g.beginPath();
      g.moveTo(0, -h / 2);
      g.quadraticCurveTo(0, 0, w / 2, 0);
      g.quadraticCurveTo(0, 0, 0, h / 2);
      g.quadraticCurveTo(0, 0, -w / 2, 0);
      g.quadraticCurveTo(0, 0, 0, -h / 2);
      g.fill();
      g.restore();
    }
  }],
  wick0: [96, 96, wick(0)],
  wick1: [96, 96, wick(1)],
  wick2: [96, 96, wick(2)],
  blossom: [64, 64, (g, w, h) => {
    radial(g, w, h, [[0, "rgba(255,220,240,0.6)"], [1, "rgba(255,200,230,0)"]]);
    g.fillStyle = "#ffe1f0";
    for (let k = 0; k < 5; k++) {
      g.save();
      g.translate(w / 2, h / 2);
      g.rotate((k * 2 * Math.PI) / 5);
      g.beginPath();
      g.ellipse(0, -h * 0.2, w * 0.11, h * 0.2, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.fillStyle = "#ffd75e";
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.08, 0, Math.PI * 2);
    g.fill();
  }],
  dew: [64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w * 0.4, h * 0.38, w * 0.02, w / 2, h / 2, w * 0.42);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.3, "rgba(190,230,255,0.55)");
    grad.addColorStop(0.9, "rgba(120,190,255,0.35)");
    grad.addColorStop(1, "rgba(120,190,255,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(220,240,255,0.8)";
    g.lineWidth = w * 0.03;
    g.stroke();
  }],
  drop: [20, 48, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(180,210,255,0)");
    grad.addColorStop(0.7, "rgba(190,220,255,0.7)");
    grad.addColorStop(1, "rgba(230,245,255,1)");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(w / 2, 0);
    g.quadraticCurveTo(w, h * 0.8, w / 2, h);
    g.quadraticCurveTo(0, h * 0.8, w / 2, 0);
    g.fill();
  }],
  shadow: [64, 32, (g, w, h) => {
    g.save();
    g.scale(1, h / w);
    radial(g, w, w, [[0, "rgba(5,8,30,0.55)"], [0.7, "rgba(5,8,30,0.25)"], [1, "rgba(5,8,30,0)"]]);
    g.restore();
  }],
  bat0: [112, 56, bat(0)],
  bat1: [112, 56, bat(1)],
  lampOff: [40, 64, lantern(false, false)],
  lampOn: [40, 64, lantern(true, false)],
  lanternOff: [96, 144, lantern(false, true)],
  lanternOn: [96, 144, lantern(true, true)],
  tree: [96, 144, (g, w, h) => {
    g.fillStyle = SILHOUETTE;
    g.fillRect(w * 0.45, h * 0.6, w * 0.1, h * 0.4);
    for (const [y, r] of [
      [0.62, 0.42],
      [0.42, 0.34],
      [0.24, 0.24],
    ]) {
      g.beginPath();
      g.ellipse(w / 2, h * y, w * r, h * r * 0.5, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = SILHOUETTE_EDGE;
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(w / 2, h * 0.24, w * 0.24, h * 0.12, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  }],
  cottage: [128, 104, (g, w, h) => {
    g.fillStyle = SILHOUETTE;
    g.fillRect(w * 0.12, h * 0.45, w * 0.76, h * 0.55);
    g.beginPath();
    g.moveTo(w * 0.04, h * 0.48);
    g.lineTo(w * 0.5, h * 0.1);
    g.lineTo(w * 0.96, h * 0.48);
    g.closePath();
    g.fill();
    g.fillRect(w * 0.7, h * 0.1, w * 0.08, h * 0.25);
    // A window, lit low: somebody is asleep in there.
    g.fillStyle = "#e9b85a";
    g.fillRect(w * 0.26, h * 0.6, w * 0.12, h * 0.14);
    g.fillStyle = "#5b4a2e";
    g.fillRect(w * 0.6, h * 0.6, w * 0.12, h * 0.14);
  }],
  windmill: [96, 160, (g, w, h) => {
    g.fillStyle = SILHOUETTE;
    g.beginPath();
    g.moveTo(w * 0.3, h);
    g.lineTo(w * 0.4, h * 0.22);
    g.lineTo(w * 0.6, h * 0.22);
    g.lineTo(w * 0.7, h);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(w * 0.34, h * 0.24);
    g.lineTo(w * 0.5, h * 0.1);
    g.lineTo(w * 0.66, h * 0.24);
    g.fill();
    g.fillStyle = "#e9b85a";
    g.fillRect(w * 0.46, h * 0.55, w * 0.08, h * 0.07);
  }],
  blades: [128, 128, (g, w, h) => {
    g.fillStyle = SILHOUETTE;
    g.strokeStyle = SILHOUETTE_EDGE;
    g.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      g.save();
      g.translate(w / 2, h / 2);
      g.rotate((k * Math.PI) / 2);
      g.fillRect(-w * 0.04, -h * 0.48, w * 0.1, h * 0.42);
      g.strokeRect(-w * 0.04, -h * 0.48, w * 0.1, h * 0.42);
      g.restore();
    }
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.05, 0, Math.PI * 2);
    g.fill();
  }],
  belfry: [112, 256, (g, w, h) => {
    g.fillStyle = SILHOUETTE;
    g.fillRect(w * 0.2, h * 0.28, w * 0.6, h * 0.72);
    g.beginPath();
    g.moveTo(w * 0.12, h * 0.3);
    g.lineTo(w * 0.5, h * 0.02);
    g.lineTo(w * 0.88, h * 0.3);
    g.closePath();
    g.fill();
    // The bell's arch, warm.
    g.fillStyle = "#3a2f55";
    g.beginPath();
    g.arc(w / 2, h * 0.42, w * 0.16, Math.PI, 0);
    g.lineTo(w * 0.66, h * 0.52);
    g.lineTo(w * 0.34, h * 0.52);
    g.closePath();
    g.fill();
    g.fillStyle = "#e9b85a";
    g.fillRect(w * 0.44, h * 0.66, w * 0.12, h * 0.05);
  }],
  moon: [128, 128, (g, w, h) => {
    radial(g, w, h, [[0, "rgba(244,240,220,0.35)"], [0.35, "rgba(244,240,220,0.16)"], [1, "rgba(244,240,220,0)"]]);
    g.fillStyle = "#f4f0dc";
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(w / 2 + w * 0.08, h / 2 - h * 0.05, w * 0.15, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = "source-over";
  }],
};

function bat(beat: number): Painter {
  return (g, w, h) => {
    const up = beat === 0;
    g.fillStyle = "#0a0c1e";
    g.beginPath();
    g.ellipse(w / 2, h * 0.55, w * 0.07, h * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(w / 2, h * 0.5);
      g.quadraticCurveTo(w / 2 + side * w * 0.25, up ? h * 0.05 : h * 0.55, w / 2 + side * w * 0.48, up ? h * 0.15 : h * 0.8);
      g.quadraticCurveTo(w / 2 + side * w * 0.32, up ? h * 0.4 : h * 0.7, w / 2 + side * w * 0.22, up ? h * 0.42 : h * 0.85);
      g.quadraticCurveTo(w / 2 + side * w * 0.14, h * 0.6, w / 2, h * 0.62);
      g.fill();
    }
    g.fillStyle = "#ffd75e";
    g.fillRect(w / 2 - w * 0.03, h * 0.45, w * 0.015, h * 0.04);
    g.fillRect(w / 2 + w * 0.015, h * 0.45, w * 0.015, h * 0.04);
  };
}

export type Atlas = { canvas: HTMLCanvasElement; cells: Record<SpriteName, Cell>; scale: number };

/** Packs and draws every sprite onto one canvas, tallest first, in shelves. */
export function buildAtlas(): Atlas {
  const names = (Object.keys(PAINTERS) as SpriteName[]).sort((a, b) => PAINTERS[b][1] - PAINTERS[a][1]);
  const cells = {} as Record<SpriteName, Cell>;
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const name of names) {
    const w = Math.ceil(PAINTERS[name][0] * SCALE) + 2;
    const h = Math.ceil(PAINTERS[name][1] * SCALE) + 2;
    if (x + w > ATLAS_W) {
      x = 0;
      y += shelf;
      shelf = 0;
    }
    cells[name] = { x: x + 1, y: y + 1, w: w - 2, h: h - 2 };
    x += w;
    shelf = Math.max(shelf, h);
  }
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_W;
  canvas.height = y + shelf;
  const g = canvas.getContext("2d")!;
  for (const name of names) {
    const cell = cells[name];
    const [w, h, paint] = PAINTERS[name];
    g.save();
    g.translate(cell.x, cell.y);
    g.beginPath();
    g.rect(0, 0, cell.w, cell.h);
    g.clip();
    g.scale(SCALE, SCALE);
    paint(g, w, h);
    g.restore();
  }
  return { canvas, cells, scale: SCALE };
}
