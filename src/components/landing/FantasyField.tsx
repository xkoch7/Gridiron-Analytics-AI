"use client";

import { useEffect, useRef } from "react";
import styles from "./FantasyField.module.css";

// Pixel-art football field seen from the sideline in perspective.
// The QB and receiver stand still; the only motion is the ball spinning in mid-air.

// Canvas size in "game pixels", scaled up with crisp pixels
const W = 240;
const H = 118;

// Perspective: the far sideline is narrower than the near one
const FAR_Y = 36; // screen row of the far sideline
const NEAR_Y = 104; // screen row of the near sideline
const SLAB = 6; // thickness of the field's front edge
const S_FAR = 1.45; // pixels per yard at the far sideline
const S_NEAR = 1.9; // pixels per yard at the near sideline
const CX = W / 2;

const scaleAtRow = (y: number) => S_FAR + ((S_NEAR - S_FAR) * (y - FAR_Y)) / (NEAR_Y - FAR_Y);

// depth: 0 = far sideline, 1 = near sideline. yard: 0..120 end line to end line.
function project(yard: number, depth: number) {
  const inv = 1 / S_FAR - depth * (1 / S_FAR - 1 / S_NEAR);
  const s = 1 / inv;
  return {
    x: Math.round(CX + (yard - 60) * s),
    y: Math.round(FAR_Y + ((s - S_FAR) / (S_NEAR - S_FAR)) * (NEAR_Y - FAR_Y)),
    s,
  };
}

const FPS = 12;

// Colors
type RGB = [number, number, number];
const GRASS_A: RGB = [62, 142, 65];
const GRASS_B: RGB = [70, 154, 72];
const LINE: RGB = [232, 236, 242];
const ENDZONE_LEFT: RGB = [44, 74, 128];
const ENDZONE_RIGHT: RGB = [184, 29, 49];
const shade = ([r, g, b]: RGB, f: number): RGB => [r * f, g * f, b * f];
const YELLOW = "#f2c12e";

// Flat, chunky player style: no outlines, big blocks of color, a few shade pixels
const PALETTE: Record<string, string> = {
  W: "#f4f6fa", // helmet, jersey number
  R: "#d7263d", // helmet stripe, socks
  S: "#e0a46e", // skin
  M: "#b9d3f5", // facemask
  J: "#d7263d", // jersey
  D: "#8f1426", // jersey shade
  P: "#f4f6fa", // pants
  B: "#1a2238", // cleats
  K: "#0b1529", // ball outline
  O: "#8a4b21", // ball
  L: "#f4f6fa", // laces
};

// QB facing right in the throwing follow-through: leaning forward, throwing arm
// carried through after the release, front foot planted, back foot pivoted onto its toe
const QB = [
  "........WWW...",
  ".......WRRWW..",
  ".......WWWSM..",
  "......JJJSS...",
  "....DJJJJJJ...",
  "..SSDJJWJJJSS.",
  "..S.DJJWJJ..SS",
  ".....JJJJ.....",
  ".....PPPPP....",
  "....PP..PPP...",
  "...PP....PP...",
  "..RR.....PP...",
  ".RR......RR...",
  "BB......BBBB..",
];

// Receiver running toward the end zone: compact upright stride, arms swinging
// (front arm bent and pumping forward, back arm swung behind),
// front foot landing and back foot just lifting off behind
const WR = [
  "......WWW.....",
  ".....WRRWW....",
  ".....WWWSM....",
  "......JSS.....",
  ".....JJJJJ.SS.",
  "...SSJJWJJ.S..",
  "..SS.JJWJJS...",
  ".SS..JJJJJ....",
  ".....PPPPP....",
  ".....PPPPP....",
  "....PP...PP...",
  "...RR.....RR..",
  "..BB......RR..",
  "..........BB..",
];

// QB skin tone (the receiver uses the default S in PALETTE)
const QB_SKIN = "#6b4226";

// Ball spiraling: the laces roll from the top of the ball to the bottom, then around the back
const BALL = [
  "....KKKKKK....",
  "..KKOOOOOOKK..",
  ".KOOOOOOOOOOK.",
  "KOOOOOOOOOOOOK",
  ".KOOOOOOOOOOK.",
  "..KKOOOOOOKK..",
  "....KKKKKK....",
];
const withLaces = (row: number) =>
  BALL.map((r, i) => (i === row ? r.slice(0, 5) + "LLLL" + r.slice(9) : r));
const BALL_FRAMES = [withLaces(1), withLaces(2), withLaces(3), withLaces(4), withLaces(5), BALL];

// 3x5 pixel font for yard numbers
const DIGITS: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
};

type Ctx = CanvasRenderingContext2D;

// Players use bigger pixels than the field, for a chunky look
const SPRITE_SCALE = 2;

function drawSprite(
  ctx: Ctx,
  rows: string[],
  left: number,
  top: number,
  mirror = false,
  scale = SPRITE_SCALE,
  colors: Record<string, string> = {}
) {
  const width = rows[0].length;
  rows.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      const color = colors[ch] ?? PALETTE[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(left + (mirror ? width - 1 - rx : rx) * scale, top + ry * scale, scale, scale);
    })
  );
}

// Pixel line (Bresenham)
function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function drawGoalpost(ctx: Ctx, yard: number) {
  const base = project(yard, 0.5);
  const near = project(yard, 0.66);
  const far = project(yard, 0.34);
  const lift = 12; // crossbar height
  const upright = 24; // upright height above the crossbar

  // Shadow on the grass
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  line(ctx, far.x + 2, far.y + 1, near.x + 2, near.y + 1);

  // Drawn twice, one pixel apart, so the posts are 2px thick
  ctx.fillStyle = YELLOW;
  ctx.fillRect(base.x, base.y - lift, 2, lift);
  for (const o of [0, 1]) {
    line(ctx, far.x + o, far.y - lift, near.x + o, near.y - lift);
    line(ctx, far.x + o, far.y - lift, far.x + o, far.y - lift - upright);
    line(ctx, near.x + o, near.y - lift, near.x + o, near.y - lift - upright);
  }
}

function drawField(ctx: Ctx) {
  const img = ctx.createImageData(W, H);
  const put = (x: number, y: number, [r, g, b]: RGB) => {
    const i = (y * W + x) * 4;
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = 255;
  };

  for (let y = FAR_Y; y < NEAR_Y; y++) {
    const s = scaleAtRow(y);
    const depth = (1 / S_FAR - 1 / s) / (1 / S_FAR - 1 / S_NEAR);
    const half = 0.5 / s; // half a pixel, in yards
    for (let x = 0; x < W; x++) {
      const yard = (x - CX) / s + 60;
      if (yard < 0 || yard >= 120) continue;

      let color: RGB;
      if (yard < 10) color = ENDZONE_LEFT;
      else if (yard >= 110) color = ENDZONE_RIGHT;
      else color = Math.floor((yard - 10) / 5) % 2 ? GRASS_B : GRASS_A;

      const fieldYard = yard - 10;
      const toFive = Math.abs(fieldYard - Math.round(fieldYard / 5) * 5);
      const toOne = Math.abs(fieldYard - Math.round(fieldYard));
      const isEdge = y === FAR_Y || y === NEAR_Y - 1 || yard < half * 2 || yard > 120 - half * 2;
      const isYardLine = fieldYard >= -half && fieldYard <= 100 + half && toFive < half;
      const isHash =
        fieldYard > 0 && fieldYard < 100 && toOne < half &&
        (Math.abs(depth - 0.42) < 0.02 || Math.abs(depth - 0.58) < 0.02 || depth < 0.04 || depth > 0.96);
      if (isEdge || isYardLine || isHash) color = LINE;

      put(x, y, color);
    }
  }

  // Front edge of the field, so it reads like a slab
  const left = project(0, 1).x;
  const right = project(120, 1).x;
  for (let y = NEAR_Y; y < NEAR_Y + SLAB; y++) {
    for (let x = left; x < right; x++) {
      const yard = (x - CX) / S_NEAR + 60;
      const top = yard < 10 ? ENDZONE_LEFT : yard >= 110 ? ENDZONE_RIGHT : GRASS_A;
      put(x, y, shade(top, y === NEAR_Y ? 0.75 : 0.55));
    }
  }
  ctx.putImageData(img, 0, 0);

  // Yard numbers along the near side
  ctx.fillStyle = "rgba(232,236,242,0.85)";
  for (let fieldYard = 10; fieldYard < 100; fieldYard += 10) {
    const label = String(fieldYard <= 50 ? fieldYard : 100 - fieldYard);
    const p = project(fieldYard + 10, 0.84);
    let cx = p.x - 3;
    for (const d of label) {
      DIGITS[d].forEach((row, ry) =>
        [...row].forEach((bit, rx) => {
          if (bit === "1") ctx.fillRect(cx + rx, p.y - 2 + ry, 1, 1);
        })
      );
      cx += 4;
    }
  }

  drawGoalpost(ctx, -1);
  drawGoalpost(ctx, 121);
}

// Where the players and ball sit
const PLAYER_DEPTH = 0.72;
const qbFeet = project(36, PLAYER_DEPTH);
const wrFeet = project(88, PLAYER_DEPTH);
const ballGround = project(62, PLAYER_DEPTH);
const BALL_HEIGHT = 36;

function drawPlayers(ctx: Ctx) {
  // Blocky shadows under the feet
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (const feet of [qbFeet, wrFeet]) {
    ctx.fillRect(feet.x - 13, feet.y - 2, 26, 3);
    ctx.fillRect(feet.x - 10, feet.y + 1, 20, 1);
  }
  const half = QB[0].length; // sprite width / 2, in canvas pixels at 2x
  drawSprite(ctx, QB, qbFeet.x - half, qbFeet.y - QB.length * SPRITE_SCALE, false, SPRITE_SCALE, { S: QB_SKIN });
  drawSprite(ctx, WR, wrFeet.x - half, wrFeet.y - WR.length * SPRITE_SCALE);
}

function drawBall(ctx: Ctx, frame: number) {
  const left = ballGround.x - 7;
  const top = ballGround.y - BALL_HEIGHT;
  // Motion streaks trailing behind the ball
  ctx.fillStyle = "rgba(244,246,250,0.55)";
  ctx.fillRect(left - 7, top + 1, 5, 1);
  ctx.fillRect(left - 11, top + 3, 8, 1);
  ctx.fillRect(left - 7, top + 5, 5, 1);
  // The ball uses the field's pixel size so it stays small next to the players
  drawSprite(ctx, BALL_FRAMES[frame % BALL_FRAMES.length], left, top, false, 1);
}

export default function FantasyField() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    // Everything but the ball is drawn once and reused
    const scene = document.createElement("canvas");
    scene.width = W;
    scene.height = H;
    const sceneCtx = scene.getContext("2d")!;
    drawField(sceneCtx);
    drawPlayers(sceneCtx);

    const render = (frame: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(scene, 0, 0);
      drawBall(ctx, frame);
    };

    // Scale by whole numbers so every game pixel is the same size
    const resize = () => {
      const s = Math.min(8, Math.floor(Math.min(wrap.clientWidth / W, (window.innerHeight * 0.85) / H)));
      canvas.style.width = s >= 2 ? `${W * s}px` : "100%";
      canvas.style.height = s >= 2 ? `${H * s}px` : "auto";
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("resize", resize);
    const cleanupSize = () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };

    // Respect reduced motion: the ball holds still
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(1);
      return cleanupSize;
    }

    // Only animate while the field is on screen
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    let lastFrame = -1;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const frame = Math.floor(((now - start) / 1000) * FPS);
      if (frame === lastFrame) return;
      lastFrame = frame;
      render(frame);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      cleanupSize();
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className={styles.canvas}
        role="img"
        aria-label="Pixel-art football field: a quarterback and a receiver with a spinning football in the air between them"
      />
    </div>
  );
}
