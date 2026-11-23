"use client";

import { useEffect, useRef } from "react";
import styles from "./LivingRoom.module.css";

// A 3D living room on game day: a family on the couch (seen from behind) watching
// a game on the TV, with framed jerseys (including Lamar Jackson's #8), bunting,
// pennants and a football-field rug. Lit by the TV glow and a warm lamp.

const PURPLE = "#241773";
const GOLD = "#9e7c0c";
const RED = "#c8102e";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

// Team logos: drop official logo files at these paths (PNG with transparency works best).
// Until a file is there, a simple placeholder shield with the team abbreviation is drawn.
const TEAMS = {
  BAL: { name: "BALTIMORE", color: PURPLE, alt: GOLD, logo: "/logos/BAL.png" },
  CLE: { name: "CLEVELAND", color: "#311d00", alt: "#ff3c00", logo: "/logos/CLE.png" },
};
type TeamKey = keyof typeof TEAMS;
type Logos = Record<TeamKey, HTMLImageElement | null>;

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Draws the team's logo centered at (x, y), or a placeholder shield if no file was provided
function drawLogo(c: CanvasRenderingContext2D, logos: Logos, team: TeamKey, x: number, y: number, size: number) {
  const img = logos[team];
  if (img) {
    const k = size / Math.max(img.width, img.height);
    c.drawImage(img, x - (img.width * k) / 2, y - (img.height * k) / 2, img.width * k, img.height * k);
    return;
  }
  const { color, alt } = TEAMS[team];
  const w = size * 0.8;
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(-w / 2, -size / 2);
  c.lineTo(w / 2, -size / 2);
  c.lineTo(w / 2, size * 0.05);
  c.quadraticCurveTo(w / 2, size * 0.35, 0, size / 2);
  c.quadraticCurveTo(-w / 2, size * 0.35, -w / 2, size * 0.05);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.lineWidth = size * 0.06;
  c.strokeStyle = alt;
  c.stroke();
  c.fillStyle = "#ffffff";
  c.font = `900 ${size * 0.3}px Arial Black, Arial, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(team, 0, -size * 0.02);
  c.restore();
}

function makeCanvas(w: number, h: number, draw: Draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, w, h);
  return canvas;
}

// ---------- Canvas artwork ----------

const drawWoodFloor: Draw = (c, w, h) => {
  const rowH = 64;
  for (let y = 0; y < h; y += rowH) {
    let x = -Math.random() * 300;
    while (x < w) {
      const len = 220 + Math.random() * 260;
      const shade = 90 + Math.random() * 30;
      c.fillStyle = `rgb(${shade + 20},${shade * 0.68},${shade * 0.42})`;
      c.fillRect(x, y, len, rowH);
      // Grain
      c.strokeStyle = "rgba(40,22,10,0.25)";
      c.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const gy = y + 6 + Math.random() * (rowH - 12);
        c.beginPath();
        c.moveTo(x, gy);
        c.bezierCurveTo(x + len * 0.3, gy + 3, x + len * 0.6, gy - 3, x + len, gy);
        c.stroke();
      }
      // Seams between planks
      c.fillStyle = "rgba(20,10,4,0.6)";
      c.fillRect(x, y, 2, rowH);
      x += len;
    }
    c.fillStyle = "rgba(20,10,4,0.6)";
    c.fillRect(0, y, w, 2);
  }
};

// Rug printed like a football field, with purple and red end zones
const drawFieldRug: Draw = (c, w, h) => {
  const ez = w * 0.09;
  c.fillStyle = "#2f7a33";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? "#357f38" : "#2c7330";
    c.fillRect(ez + ((w - 2 * ez) / 10) * i, 0, (w - 2 * ez) / 10, h);
  }
  c.fillStyle = PURPLE;
  c.fillRect(0, 0, ez, h);
  c.fillStyle = RED;
  c.fillRect(w - ez, 0, ez, h);
  c.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i <= 10; i++) c.fillRect(ez + ((w - 2 * ez) / 10) * i - 2, 0, 4, h);
  c.font = "bold 44px Arial, sans-serif";
  c.textAlign = "center";
  const labels = ["10", "20", "30", "40", "50", "40", "30", "20", "10"];
  labels.forEach((t, i) => {
    const x = ez + ((w - 2 * ez) / 10) * (i + 1);
    c.fillText(t, x, h * 0.2);
    c.fillText(t, x, h * 0.88);
  });
  c.strokeStyle = "rgba(255,255,255,0.9)";
  c.lineWidth = 10;
  c.strokeRect(5, 5, w - 10, h - 10);
};

function drawJersey(color: string, name: string, number: string, trim: [string, string]): Draw {
  return (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    // Sleeve stripes
    for (const side of [-1, 1]) {
      const cx = w / 2 + side * w * 0.39;
      c.fillStyle = trim[0];
      c.fillRect(cx - 22, 0, 16, h * 0.45);
      c.fillStyle = trim[1];
      c.fillRect(cx - 6, 0, 10, h * 0.45);
    }
    // Collar
    c.fillStyle = trim[0];
    c.beginPath();
    c.ellipse(w / 2, 0, w * 0.12, h * 0.05, 0, 0, Math.PI);
    c.fill();
    // Name and number on the back
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#fff";
    c.font = "bold 52px Arial, sans-serif";
    c.fillText(name, w / 2, h * 0.19);
    c.font = "900 250px Arial Black, Arial, sans-serif";
    c.lineJoin = "round";
    c.lineWidth = 14;
    c.strokeStyle = trim[0];
    c.strokeText(number, w / 2, h * 0.56);
    c.fillText(number, w / 2, h * 0.56);
  };
}

// Small name/number patch for the back of a family member's jersey
function drawJerseyBack(name: string, number: string, outline: string): Draw {
  return (c, w, h) => {
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#fff";
    c.font = "bold 40px Arial, sans-serif";
    c.fillText(name, w / 2, h * 0.16);
    c.font = "900 170px Arial Black, Arial, sans-serif";
    c.lineWidth = 10;
    c.lineJoin = "round";
    c.strokeStyle = outline;
    c.strokeText(number, w / 2, h * 0.58);
    c.fillText(number, w / 2, h * 0.58);
  };
}

function drawPennant(color: string, text: string, textColor: string, logo?: { logos: Logos; team: TeamKey }): Draw {
  return (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    // Felt texture
    for (let i = 0; i < 4000; i++) {
      c.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)";
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    c.fillStyle = "#f4f1e8";
    c.fillRect(0, 0, w * 0.06, h);
    let textX = w * 0.1;
    if (logo) {
      drawLogo(c, logo.logos, logo.team, w * 0.17, h / 2, h * 0.62);
      textX = w * 0.26;
    }
    c.fillStyle = textColor;
    c.font = `bold ${h * 0.26}px Arial Black, Arial, sans-serif`;
    c.textBaseline = "middle";
    c.fillText(text, textX, h / 2);
  };
}

// Big team flag for the wall
function drawTeamFlag(logos: Logos, team: TeamKey): Draw {
  return (c, w, h) => {
    const { color, alt, name } = TEAMS[team];
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    c.fillStyle = alt;
    c.fillRect(0, h * 0.06, w, h * 0.04);
    c.fillRect(0, h * 0.9, w, h * 0.04);
    for (let i = 0; i < 6000; i++) {
      c.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)";
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    drawLogo(c, logos, team, w / 2, h * 0.44, h * 0.5);
    c.fillStyle = "#ffffff";
    c.font = `900 ${h * 0.11}px Arial Black, Arial, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(name, w / 2, h * 0.8);
  };
}

// Fine noise for fabric weave, wall paint and hair strands (used as bump maps)
const drawWeave: Draw = (c, w, h) => {
  c.fillStyle = "rgb(128,128,128)";
  c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    c.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.08})`;
    c.fillRect(0, y, w, 1);
  }
  for (let x = 0; x < w; x += 2) {
    c.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.06})`;
    c.fillRect(x, 0, 1, h);
  }
};
const drawPaint: Draw = (c, w, h) => {
  c.fillStyle = "rgb(128,128,128)";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30000; i++) {
    const v = 110 + Math.random() * 40;
    c.fillStyle = `rgb(${v},${v},${v})`;
    c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
};
const drawHair: Draw = (c, w, h) => {
  c.fillStyle = "rgb(128,128,128)";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * w;
    const v = Math.random() < 0.5 ? 70 : 190;
    c.strokeStyle = `rgba(${v},${v},${v},0.5)`;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, 0);
    c.bezierCurveTo(x + 6, h * 0.3, x - 6, h * 0.6, x + 3, h);
    c.stroke();
  }
};

// The game on TV: a broadcast-style view with players, moving yard lines and a score bug
function drawBroadcast(c: CanvasRenderingContext2D, w: number, h: number, t: number, logos: Logos) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#2d6e2f");
  g.addColorStop(1, "#3f9443");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // Yard lines in perspective, panning with the play
  const pan = (t * 60) % 120;
  c.strokeStyle = "rgba(255,255,255,0.8)";
  c.lineWidth = 3;
  for (let i = -2; i < 12; i++) {
    const top = i * 90 - pan * 0.75;
    const bottom = i * 120 - pan;
    c.beginPath();
    c.moveTo(top + 60, 0);
    c.lineTo(bottom, h);
    c.stroke();
  }

  // Players: purple offense driving right, red defense
  const drift = Math.sin(t * 0.5) * 40 + t * 8;
  const player = (x: number, y: number, jersey: string, helmet: string) => {
    const px = ((x + drift) % (w + 100)) - 50;
    c.fillStyle = "rgba(0,0,0,0.25)";
    c.beginPath();
    c.ellipse(px + 4, y + 14, 12, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = jersey;
    c.fillRect(px - 8, y - 8, 16, 20);
    c.fillStyle = "#f4f4f4";
    c.fillRect(px - 7, y + 10, 14, 8);
    c.fillStyle = helmet;
    c.beginPath();
    c.arc(px, y - 13, 7, 0, Math.PI * 2);
    c.fill();
  };
  const bob = (i: number) => Math.sin(t * 6 + i) * 2;
  [200, 240, 280, 320, 360, 300, 230, 420, 120, 470, 260].forEach((y, i) =>
    player(380 + (i % 3) * 18 + (i > 6 ? -60 : 0), y + bob(i), PURPLE, "#1a1a1a")
  );
  [210, 250, 290, 330, 370, 180, 400, 140, 460, 300, 240].forEach((y, i) =>
    player(440 + (i > 4 ? 60 + (i % 2) * 70 : 0), y + bob(i + 3), TEAMS.CLE.alt, TEAMS.CLE.alt)
  );

  // Score bug
  c.fillStyle = "rgba(8,12,24,0.92)";
  c.fillRect(40, h - 70, w - 80, 46);
  c.fillStyle = TEAMS.BAL.color;
  c.fillRect(40, h - 70, 170, 46);
  c.fillStyle = TEAMS.CLE.color;
  c.fillRect(210, h - 70, 170, 46);
  drawLogo(c, logos, "BAL", 62, h - 47, 36);
  drawLogo(c, logos, "CLE", 232, h - 47, 36);
  c.fillStyle = "#fff";
  c.font = "bold 28px Arial, sans-serif";
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText("BAL 24", 88, h - 47);
  c.fillText("CLE 17", 258, h - 47);
  const secs = Math.max(0, 252 - Math.floor(t));
  c.fillText(`4TH   ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`, 420, h - 47);
  c.fillStyle = "#f2c12e";
  c.fillText("2ND & 7", 650, h - 47);
}

// ---------- Component ----------

export default function LivingRoom() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const { RectAreaLightUniformsLib } = await import("three/examples/jsm/lights/RectAreaLightUniformsLib.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { GTAOPass } = await import("three/examples/jsm/postprocessing/GTAOPass.js");
      const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
      const { OutputPass } = await import("three/examples/jsm/postprocessing/OutputPass.js");
      const teamKeys = Object.keys(TEAMS) as TeamKey[];
      const logoImages = await Promise.all(teamKeys.map((k) => loadImage(TEAMS[k].logo)));
      const logos = Object.fromEntries(teamKeys.map((k, i) => [k, logoImages[i]])) as Logos;
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch {
        return; // No WebGL: leave the space empty
      }
      RectAreaLightUniformsLib.init();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = styles.canvas;
      wrap.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#0d1018");
      // Soft reflections from a generic room, kept dim so the TV and lamp still lead
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.22;
      const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 40);
      const camBase = new THREE.Vector3(0, 2.25, 4.6);
      const lookAt = new THREE.Vector3(0, 0.8, -2.2);
      camera.position.copy(camBase);
      camera.lookAt(lookAt);

      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const tex = (canvas: HTMLCanvasElement, repeat?: [number, number]) => {
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        if (repeat) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(...repeat);
        }
        textures.push(t);
        return t;
      };
      const mat = (color: string, roughness = 0.85, extra: Record<string, unknown> = {}) =>
        new THREE.MeshStandardMaterial({ color, roughness, ...extra });
      // Cloth: soft sheen at grazing angles plus a fine weave in the bump map
      const weaveTex = tex(makeCanvas(256, 256, drawWeave), [6, 6]);
      const hairTex = tex(makeCanvas(256, 256, drawHair), [2, 1]);
      const cloth = (color: string, extra: Record<string, unknown> = {}) =>
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.9,
          sheen: 0.8,
          sheenRoughness: 0.7,
          sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.35),
          bumpMap: weaveTex,
          bumpScale: 0.6,
          ...extra,
        });
      const hairMat = (color: string) =>
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.5,
          sheen: 0.5,
          sheenColor: new THREE.Color("#8a6a50"),
          bumpMap: hairTex,
          bumpScale: 1.5,
        });

      type Obj = InstanceType<typeof THREE.Object3D>;
      const add = <T extends Obj>(o: T, parent: Obj = scene, shadows = true): T => {
        o.traverse((child) => {
          if ((child as InstanceType<typeof THREE.Mesh>).isMesh) {
            child.castShadow = shadows;
            child.receiveShadow = true;
          }
        });
        parent.add(o);
        return o;
      };
      const rbox = (w: number, h: number, d: number, material: InstanceType<typeof THREE.Material>, x: number, y: number, z: number, parent?: Obj) => {
        const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.22), material);
        m.position.set(x, y, z);
        return add(m, parent);
      };
      const box = (w: number, h: number, d: number, material: InstanceType<typeof THREE.Material>, x: number, y: number, z: number, parent?: Obj) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        m.position.set(x, y, z);
        return add(m, parent);
      };
      // Flat shape with its UVs stretched over its bounding box, for canvas artwork
      const shapeMesh = (shape: InstanceType<typeof THREE.Shape>, material: InstanceType<typeof THREE.Material>) => {
        const geo = new THREE.ShapeGeometry(shape, 12);
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
        }
        uv.needsUpdate = true;
        return new THREE.Mesh(geo, material);
      };

      // ----- Room -----
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 7.5),
        mat("#ffffff", 0.7, { map: tex(makeCanvas(1024, 1024, drawWoodFloor), [3, 3]) })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, 0.75);
      add(floor, scene, false);

      const paintTex = tex(makeCanvas(512, 512, drawPaint), [6, 3]);
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.8), mat("#3a4256", 0.95, { bumpMap: paintTex, bumpScale: 0.3 }));
      backWall.position.set(0, 1.4, -3);
      add(backWall, scene, false);
      const sideMat = mat("#5c554d", 0.95, { bumpMap: paintTex, bumpScale: 0.3 });
      for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 2.8), sideMat);
        wall.rotation.y = (-side * Math.PI) / 2;
        wall.position.set(side * 3.5, 1.4, 0.75);
        add(wall, scene, false);
        box(0.02, 0.12, 7.5, mat("#d9d4c8", 0.6), side * 3.49, 0.06, 0.75);
      }
      box(7, 0.12, 0.02, mat("#d9d4c8", 0.6), 0, 0.06, -2.99);
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(7, 7.5), mat("#1c1f27", 1));
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(0, 2.8, 0.75);
      add(ceiling, scene, false);

      // ----- TV wall -----
      const wood = mat("#8a6a55", 0.45, { map: tex(makeCanvas(512, 512, drawWoodFloor)) });
      rbox(2.2, 0.5, 0.45, wood, 0, 0.25, -2.76);
      box(1.0, 0.07, 0.1, mat("#111111", 0.4), 0, 0.535, -2.68);
      rbox(1.52, 0.9, 0.06, mat("#0b0b0d", 0.25, { metalness: 0.3 }), 0, 1.45, -2.94);

      const screenCanvas = document.createElement("canvas");
      screenCanvas.width = 1024;
      screenCanvas.height = 576;
      const screenCtx = screenCanvas.getContext("2d")!;
      drawBroadcast(screenCtx, 1024, 576, 0, logos);
      const screenTex = tex(screenCanvas);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.44, 0.81),
        new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
      );
      screen.position.set(0, 1.45, -2.905);
      scene.add(screen);

      // The TV lights the room
      const tvLight = new THREE.RectAreaLight(0xcfe6ff, 9, 1.44, 0.81);
      tvLight.position.set(0, 1.45, -2.88);
      tvLight.lookAt(0, 1.45, 2);
      scene.add(tvLight);

      // Framed jerseys on either side of the TV
      const jerseyShape = () => {
        const s = new THREE.Shape();
        s.moveTo(-0.08, 0.4);
        s.quadraticCurveTo(0, 0.35, 0.08, 0.4);
        s.lineTo(0.22, 0.38);
        s.lineTo(0.42, 0.24);
        s.lineTo(0.35, 0.09);
        s.lineTo(0.24, 0.16);
        s.lineTo(0.24, -0.42);
        s.lineTo(-0.24, -0.42);
        s.lineTo(-0.24, 0.16);
        s.lineTo(-0.35, 0.09);
        s.lineTo(-0.42, 0.24);
        s.lineTo(-0.22, 0.38);
        s.closePath();
        return s;
      };
      const framedJersey = (x: number, art: Draw) => {
        const group = new THREE.Group();
        rbox(1.0, 1.1, 0.07, mat("#1b140f", 0.5), 0, 0, 0, group);
        const matBoard = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.98), mat("#ece8df", 0.9));
        matBoard.position.z = 0.036;
        add(matBoard, group, false);
        const jersey = shapeMesh(jerseyShape(), mat("#ffffff", 0.75, { map: tex(makeCanvas(512, 512, art)) }));
        jersey.position.z = 0.04;
        jersey.scale.setScalar(0.98);
        add(jersey, group, false);
        group.position.set(x, 1.55, -2.95);
        scene.add(group);
      };
      framedJersey(-1.85, drawJersey(PURPLE, "JACKSON", "8", ["#000000", GOLD]));
      framedJersey(1.85, drawJersey(RED, "CARTER", "15", ["#0b1529", "#ffffff"]));

      // Bunting across the top of the TV wall
      const buntingColors = [PURPLE, GOLD, "#f4f1e8", "#111111"];
      const stringPts: InstanceType<typeof THREE.Vector3>[] = [];
      for (let i = 0; i <= 30; i++) {
        const x = -3.3 + (6.6 * i) / 30;
        stringPts.push(new THREE.Vector3(x, 2.55 - 0.18 * (1 - (x / 3.3) ** 2), -2.93));
      }
      const stringCurve = new THREE.CatmullRomCurve3(stringPts);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(stringCurve, 60, 0.006, 4), mat("#ddd8cc")));
      const flagShape = new THREE.Shape();
      flagShape.moveTo(-0.11, 0);
      flagShape.lineTo(0.11, 0);
      flagShape.lineTo(0, -0.24);
      flagShape.closePath();
      const flagGeo = new THREE.ShapeGeometry(flagShape);
      for (let i = 0; i < 22; i++) {
        const p = stringCurve.getPointAt((i + 0.5) / 22);
        const flag = new THREE.Mesh(
          flagGeo,
          mat(buntingColors[i % buntingColors.length], 0.9, { side: THREE.DoubleSide })
        );
        flag.position.set(p.x, p.y, p.z + 0.01);
        flag.rotation.x = 0.08;
        add(flag, scene, false);
      }

      // Pennants on the side walls
      const pennantShape = new THREE.Shape();
      pennantShape.moveTo(0, 0.14);
      pennantShape.lineTo(0.9, 0);
      pennantShape.lineTo(0, -0.14);
      pennantShape.closePath();
      const pennants: [number, number, number, string, string, string, TeamKey | null][] = [
        [1, -2.25, 1.95, TEAMS.CLE.alt, "CLEVELAND", "#ffffff", "CLE"],
        [1, -1.15, 1.6, "#0b1529", "GAME DAY", "#f2c12e", null],
      ];
      for (const [side, z, y, color, text, textColor, team] of pennants) {
        const p = shapeMesh(
          pennantShape,
          cloth("#ffffff", {
            map: tex(makeCanvas(512, 160, drawPennant(color, text, textColor, team ? { logos, team } : undefined))),
            sheen: 0.4,
            bumpScale: 0.3,
          })
        );
        p.rotation.y = (-side * Math.PI) / 2;
        p.rotation.z = -0.06;
        p.position.set(side * 3.48, y, z + (side < 0 ? -0.45 : 0.45));
        add(p, scene, false);
      }

      // ----- Living area -----
      const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 2.2),
        mat("#ffffff", 1, { map: tex(makeCanvas(1024, 660, drawFieldRug)) })
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.006, -0.55);
      add(rug, scene, false);

      // Coffee table with a football and snacks
      rbox(1.3, 0.06, 0.65, wood, 0, 0.42, -0.6);
      for (const [lx, lz] of [[-0.58, -0.88], [0.58, -0.88], [-0.58, -0.32], [0.58, -0.32]]) {
        box(0.05, 0.4, 0.05, wood, lx, 0.2, lz);
      }
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 16), mat("#6a3114", 0.55));
      ball.scale.set(1.7, 1, 1);
      ball.position.set(-0.3, 0.54, -0.55);
      ball.rotation.y = 0.5;
      add(ball);
      for (let i = 0; i < 5; i++) {
        box(0.012, 0.006, 0.05, mat("#f4f1e8", 0.6), -0.3 - 0.04 + i * 0.02, 0.632, -0.55, undefined);
      }
      const bowlPts = [];
      for (let i = 0; i <= 10; i++) bowlPts.push(new THREE.Vector2(0.05 + 0.1 * Math.sin((i / 10) * (Math.PI / 2)), 0.07 * (i / 10)));
      const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 32), mat("#c94f2c", 0.5, { side: THREE.DoubleSide }));
      bowl.position.set(0.2, 0.45, -0.62);
      add(bowl);
      const chipMat = mat("#e8b64a", 0.7);
      for (let i = 0; i < 14; i++) {
        const chip = new THREE.Mesh(new THREE.CircleGeometry(0.028, 8), chipMat);
        chip.position.set(0.2 + (Math.random() - 0.5) * 0.12, 0.505 + Math.random() * 0.02, -0.62 + (Math.random() - 0.5) * 0.12);
        chip.rotation.set(-Math.PI / 2 + (Math.random() - 0.5) * 0.8, 0, Math.random() * 3);
        add(chip, scene, false);
      }
      for (const [cx, color] of [[0.42, RED], [0.5, "#c0c6cf"]] as const) {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.12, 24), mat(color, 0.3, { metalness: 0.6 }));
        can.position.set(cx, 0.51, -0.45);
        add(can);
      }
      box(0.16, 0.02, 0.05, mat("#151515", 0.5), -0.05, 0.46, -0.42).rotation.y = 0.3;

      // Floor lamp
      const lampX = -2.85;
      const lampZ = 0.6;
      const brass = mat("#8a6d3b", 0.35, { metalness: 0.7 });
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 32), brass);
      lampBase.position.set(lampX, 0.015, lampZ);
      add(lampBase);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 12), brass);
      pole.position.set(lampX, 0.78, lampZ);
      add(pole);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.25, 0.32, 32, 1, true),
        mat("#f3e3c3", 0.9, { side: THREE.DoubleSide, emissive: new THREE.Color("#ffb36b"), emissiveIntensity: 0.55 })
      );
      shade.position.set(lampX, 1.58, lampZ);
      add(shade, scene, false);
      const lampLight = new THREE.PointLight(0xffb36b, 7, 7, 2);
      lampLight.position.set(lampX, 1.5, lampZ);
      lampLight.castShadow = true;
      lampLight.shadow.mapSize.set(512, 512);
      lampLight.shadow.radius = 6;
      scene.add(lampLight);

      // ----- Couch -----
      const fabric = cloth("#5b6170");
      const couchZ = 1.3;
      rbox(2.9, 0.3, 1.0, fabric, 0, 0.2, couchZ);
      for (const x of [-0.93, 0, 0.93]) {
        rbox(0.9, 0.16, 0.85, fabric, x, 0.43, couchZ - 0.05);
        rbox(0.9, 0.34, 0.2, fabric, x, 0.68, couchZ + 0.3);
      }
      rbox(2.9, 0.5, 0.26, fabric, 0, 0.6, couchZ + 0.45);
      for (const side of [-1, 1]) rbox(0.24, 0.62, 1.0, fabric, side * 1.47, 0.4, couchZ);
      const blanket = rbox(0.5, 0.06, 0.3, cloth(PURPLE), 1.2, 0.88, couchZ + 0.48);
      blanket.rotation.z = -0.15;

      // ----- Family, seen from behind -----
      type Person = {
        x: number;
        scale: number;
        skin: string;
        hair: string;
        shirt: string;
        back?: Draw;
        longHair?: boolean;
        beanie?: string;
        cheer?: boolean;
        standing?: [number, number]; // x, z on the floor instead of the couch
      };
      const family: Person[] = [
        { x: -0.95, scale: 1, skin: "#8d5a3b", hair: "#1a1410", shirt: "#5a5f68" },
        { x: -0.32, scale: 0.93, skin: "#c98f68", hair: "#3b2416", shirt: GOLD, longHair: true },
        { x: 0.55, scale: 0.78, skin: "#a86f4c", hair: "#24170f", shirt: RED, back: drawJerseyBack("CARTER", "15", "#0b1529") },
        // Youngest is up off the couch cheering in a Lamar Jackson jersey
        { x: 0, scale: 0.82, skin: "#8d5a3b", hair: "#1a1410", shirt: PURPLE, back: drawJerseyBack("JACKSON", "8", "#000000"), beanie: PURPLE, cheer: true, standing: [1.2, 0.25] },
      ];
      const cheerArms: InstanceType<typeof THREE.Group>[] = [];
      for (const p of family) {
        const g = new THREE.Group();
        const shirt = cloth(p.shirt);
        const skin = mat(p.skin, 0.6);
        const hair = hairMat(p.hair);

        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 8, 24), shirt);
        torso.scale.set(1.3, 1, 0.75);
        torso.position.y = 0.31;
        add(torso, g);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 16), skin);
        neck.position.y = 0.66;
        add(neck, g);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 24), skin);
        head.scale.set(0.95, 1.1, 1);
        head.position.y = 0.79;
        add(head, g);
        for (const side of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), skin);
          ear.position.set(side * 0.095, 0.78, 0);
          add(ear, g);
        }
        // From behind we mostly see hair
        const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.104, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
        hairCap.scale.set(0.97, 1.12, 1.03);
        hairCap.position.set(0, 0.79, 0.004);
        hairCap.rotation.x = 0.35;
        add(hairCap, g);
        if (p.longHair) {
          const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.22, 6, 16), hair);
          tail.scale.set(1.3, 1, 0.6);
          tail.position.set(0, 0.62, 0.07);
          add(tail, g);
        }
        if (p.beanie) {
          const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.108, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), cloth(p.beanie, { bumpScale: 1.2 }));
          beanie.position.y = 0.81;
          add(beanie, g);
          const pom = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat(GOLD, 0.95));
          pom.position.y = 0.93;
          add(pom, g);
        }
        if (p.back) {
          const decal = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.34),
            new THREE.MeshStandardMaterial({ map: tex(makeCanvas(256, 290, p.back)), transparent: true, roughness: 0.9 })
          );
          decal.position.set(0, 0.36, 0.125);
          add(decal, g, false);
        }
        if (!p.cheer) {
          for (const side of [-1, 1]) {
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 6, 12), shirt);
            arm.position.set(side * 0.21, 0.34, 0);
            arm.rotation.z = side * 0.12;
            add(arm, g);
          }
        }
        if (p.cheer) {
          for (const side of [-1, 1]) {
            const arm = new THREE.Group();
            const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.32, 6, 12), shirt);
            upper.position.y = 0.18;
            add(upper, arm);
            const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), skin);
            hand.position.y = 0.4;
            add(hand, arm);
            arm.position.set(side * 0.17, 0.5, 0);
            arm.rotation.z = -side * 0.35;
            arm.userData.side = side;
            g.add(arm);
            cheerArms.push(arm);
          }
        }
        if (p.standing) {
          const jeans = cloth("#2b3a55", { bumpScale: 1 });
          for (const side of [-1, 1]) {
            const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 6, 12), jeans);
            leg.position.set(side * 0.08, -0.22, 0);
            add(leg, g);
            const shoe = rbox(0.11, 0.07, 0.2, mat("#f2f2f2", 0.6), side * 0.08, -0.5, -0.03, g);
            shoe.castShadow = true;
          }
        }
        g.scale.setScalar(p.scale);
        if (p.standing) g.position.set(p.standing[0], 0.535 * p.scale, p.standing[1]);
        else g.position.set(p.x, 0.52, couchZ + 0.08);
        scene.add(g);
      }
      // Dad's arm along the back of the couch
      const dadArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.5, 6, 12), cloth("#5a5f68"));
      dadArm.rotation.z = Math.PI / 2;
      dadArm.position.set(-0.62, 0.89, couchZ + 0.42);
      add(dadArm);

      // Big team flag on the left wall, hung from a rod
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.25, 0.8, 24, 12),
        cloth("#ffffff", { map: tex(makeCanvas(768, 492, drawTeamFlag(logos, "BAL"))), sheen: 0.5, bumpScale: 0.4, side: THREE.DoubleSide })
      );
      // A gentle ripple so it reads as fabric
      const flagPos = flag.geometry.attributes.position;
      for (let i = 0; i < flagPos.count; i++) {
        const fx = flagPos.getX(i);
        flagPos.setZ(i, Math.sin(fx * 9) * 0.012 + Math.sin(fx * 4 + 1) * 0.008);
      }
      flag.geometry.computeVertexNormals();
      flag.rotation.y = Math.PI / 2;
      flag.position.set(-3.46, 1.55, -1.95);
      add(flag, scene, false);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 12), brass);
      rod.rotation.x = Math.PI / 2;
      rod.position.set(-3.44, 1.97, -1.95);
      add(rod);

      // Houseplant in the back corner
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 32), mat("#d8d2c4", 0.5));
      pot.position.set(2.95, 0.2, -2.5);
      add(pot);
      const leafMat = new THREE.MeshPhysicalMaterial({ color: "#2f5d2a", roughness: 0.55, sheen: 0.3, side: THREE.DoubleSide });
      const leafGeo = new THREE.SphereGeometry(0.12, 16, 8);
      for (let i = 0; i < 26; i++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const a = Math.random() * Math.PI * 2;
        const r = 0.05 + Math.random() * 0.25;
        leaf.position.set(2.95 + Math.cos(a) * r, 0.55 + Math.random() * 0.75, -2.5 + Math.sin(a) * r);
        leaf.scale.set(0.35, 1.4, 0.08);
        leaf.rotation.set((Math.random() - 0.5) * 0.9, a, Math.cos(a) * 0.7);
        add(leaf);
      }

      // ----- Lighting -----
      scene.add(new THREE.HemisphereLight(0x9fb2d6, 0x3a2a1c, 0.7));
      const backLight = new THREE.PointLight(0xffc89a, 5, 8, 2);
      backLight.position.set(0.6, 2.5, 3.4);
      scene.add(backLight);
      const overhead = new THREE.SpotLight(0xffd2a1, 26, 9, 0.9, 0.8, 2);
      overhead.position.set(0.8, 2.75, 1.0);
      overhead.target.position.set(0, 0, -0.4);
      overhead.castShadow = true;
      overhead.shadow.mapSize.set(1024, 1024);
      overhead.shadow.radius = 5;
      scene.add(overhead, overhead.target);

      // ----- Post-processing -----
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const ao = new GTAOPass(scene, camera, 1, 1);
      ao.updateGtaoMaterial({ radius: 0.35, distanceFallOff: 1, thickness: 1, scale: 1.2 });
      composer.addPass(ao);
      const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.6, 0.85);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      const render = () => composer.render();

      // ----- Sizing, motion and rendering -----
      const resize = () => {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        renderer.setSize(w, h, false);
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      // Camera drifts a little toward the pointer
      const pointer = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      };
      const onLeave = () => {
        pointer.x = 0;
        pointer.y = 0;
      };
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(wrap);

      const start = performance.now();
      let lastScreen = -1;
      let raf = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) return;
        const t = (now - start) / 1000;

        // Broadcast updates ~15 times a second; the TV light flickers with it
        const screenFrame = Math.floor(t * 15);
        if (screenFrame !== lastScreen) {
          lastScreen = screenFrame;
          drawBroadcast(screenCtx, 1024, 576, t, logos);
          screenTex.needsUpdate = true;
          tvLight.intensity = 8.5 + Math.sin(t * 3.1) * 0.6 + Math.sin(t * 7.3) * 0.4;
        }
        for (const arm of cheerArms) {
          arm.rotation.z = -arm.userData.side * (0.3 + Math.sin(t * 6) * 0.15);
        }
        camera.position.x += (camBase.x + pointer.x * 0.35 - camera.position.x) * 0.05;
        camera.position.y += (camBase.y - pointer.y * 0.15 - camera.position.y) * 0.05;
        camera.lookAt(lookAt);
        render();
      };

      if (reduceMotion) {
        render();
      } else {
        raf = requestAnimationFrame(frame);
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        wrap.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerleave", onLeave);
        scene.traverse((o) => {
          const mesh = o as InstanceType<typeof THREE.Mesh>;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
          }
        });
        textures.forEach((t) => t.dispose());
        envTex.dispose();
        pmrem.dispose();
        composer.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="img"
      aria-label="3D living room on game day: a family on the couch watching football, with framed jerseys including Lamar Jackson's number 8, bunting and pennants"
    />
  );
}
