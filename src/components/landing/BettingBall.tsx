"use client";

import { useEffect, useRef } from "react";
import styles from "./BettingBall.module.css";

// A realistic 3D football that floats on a diagonal and spirals around its long axis.
// On hover it flips end over end and locks into a pose with the laces facing the viewer;
// when the pointer leaves it eases back into floating.

const HALF_LENGTH = 1.45; // tip to center, along x
const RADIUS = 0.9; // widest point
const PROFILE_POWER = 0.78; // higher = more pointed tips, like a pro ball

// Radius of the ball at position x along its length
const radiusAt = (x: number) => RADIUS * Math.pow(Math.max(0, 1 - (x / HALF_LENGTH) ** 2), PROFILE_POWER);

// Spin angle that tips the laces toward the camera in the locked pose
const LACE_TOWARD_VIEWER = 0.95;
const TAU = Math.PI * 2;

type Pose = { y: number; yaw: number; tilt: number; roll: number; spin: number };

// Idle: the ball holds a diagonal tilt (low-left tip to high-right tip) and spirals
// around its own long axis, like a tight pass, with a gentle wobble.
const IDLE_TILT = 0.45; // nose up toward the right
const IDLE_YAW = 0.12; // left tip turned slightly toward the viewer for depth

function idlePose(t: number): Pose {
  return {
    y: Math.sin(t * 1.2) * 0.1,
    yaw: IDLE_YAW + Math.sin(t * 0.4) * 0.08,
    tilt: IDLE_TILT + Math.sin(t * 0.55) * 0.06,
    roll: 0,
    spin: t * 1.4,
  };
}

// Locked pose, chosen near the current idle pose so the ball doesn't over-spin.
// The extra full turn on tilt is the end-over-end flip.
function lockedPose(from: Pose): Pose {
  return {
    y: 0,
    yaw: Math.round(from.yaw / TAU) * TAU,
    tilt: -0.12 + TAU,
    roll: 0,
    spin: LACE_TOWARD_VIEWER + Math.round((from.spin - LACE_TOWARD_VIEWER) / TAU) * TAU,
  };
}

const mix = (a: Pose, b: Pose, k: number): Pose => ({
  y: a.y + (b.y - a.y) * k,
  yaw: a.yaw + (b.yaw - a.yaw) * k,
  tilt: a.tilt + (b.tilt - a.tilt) * k,
  roll: a.roll + (b.roll - a.roll) * k,
  spin: a.spin + (b.spin - a.spin) * k,
});

// Slight overshoot so the ball "clicks" into place
const easeOutBack = (x: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// Leather color and bump textures, drawn on canvases.
// u (canvas x) runs around the ball, v (canvas y) runs tip to tip.
function makeLeatherCanvases() {
  // Drawn in 2048x1024 units, rendered at 1.5x so the pebbles stay crisp up close
  const w = 2048;
  const h = 1024;
  const K = 1.5;
  const color = document.createElement("canvas");
  const bump = document.createElement("canvas");
  color.width = bump.width = w * K;
  color.height = bump.height = h * K;
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;
  c.scale(K, K);
  b.scale(K, K);
  const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };

  // Base leather with soft patches of wear
  c.fillStyle = "#5a2810";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 80 + Math.random() * 220;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const tone = Math.random() < 0.5 ? "112,54,24" : "58,24,9";
    g.addColorStop(0, `rgba(${tone},0.35)`);
    g.addColorStop(1, `rgba(${tone},0)`);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  b.fillStyle = "rgb(90,90,90)";
  b.fillRect(0, 0, w, h);

  // Pebble grain: a dense, slightly irregular grid of small raised dots.
  // The gaps stay darker; each dot is a little dome in the bump map so it catches light.
  const SPACING = 8;
  for (let y = 0, row = 0; y < h + SPACING; y += SPACING, row++) {
    const shift = row % 2 ? SPACING / 2 : 0;
    for (let x = -SPACING; x < w + SPACING; x += SPACING) {
      const px = x + shift + (Math.random() - 0.5) * 2.6;
      const py = y + (Math.random() - 0.5) * 2.6;
      const r = 2.3 + Math.random() * 0.8;
      c.fillStyle = Math.random() < 0.85 ? "rgba(150,78,38,0.28)" : "rgba(40,16,6,0.25)";
      dot(c, px, py, r);
      b.fillStyle = "rgb(180,180,180)";
      dot(b, px, py, r);
      b.fillStyle = "rgb(230,230,230)";
      dot(b, px - 0.3, py - 0.3, r * 0.5);
    }
  }

  // Four panel seams: recessed grooves with a faint stitch line beside them
  for (const u of [0, 0.25, 0.5, 0.75, 1]) {
    const x = u * w;
    const shadow = c.createLinearGradient(x - 18, 0, x + 18, 0);
    shadow.addColorStop(0, "rgba(20,8,2,0)");
    shadow.addColorStop(0.5, "rgba(20,8,2,0.55)");
    shadow.addColorStop(1, "rgba(20,8,2,0)");
    c.fillStyle = shadow;
    c.fillRect(x - 18, 0, 36, h);
    c.fillStyle = "#24100a";
    c.fillRect(x - 3, 0, 6, h);

    c.fillStyle = "rgba(210,170,120,0.25)";
    for (let y = 0; y < h; y += 14) {
      c.fillRect(x - 11, y, 2, 7);
      c.fillRect(x + 9, y, 2, 7);
    }

    b.fillStyle = "rgb(20,20,20)";
    b.fillRect(x - 6, 0, 12, h);
  }

  // Lace holes beside the top seam (mostly hidden under the lace ends)
  c.fillStyle = "#1a0a04";
  b.fillStyle = "rgb(10,10,10)";
  for (let i = 0; i < 8; i++) {
    const v = (HALF_LENGTH - (-0.42 + i * 0.12)) / (2 * HALF_LENGTH);
    for (const du of [-0.028, 0.028]) {
      for (const ctx of [c, b]) {
        ctx.beginPath();
        ctx.ellipse((0.25 + du) * w, v * h, 9, 6, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  // Inflation valve on the panel opposite the laces
  c.fillStyle = "#2a1208";
  c.beginPath();
  c.arc(0.625 * w, 0.5 * h, 12, 0, TAU);
  c.fill();
  c.fillStyle = "#0e0603";
  c.beginPath();
  c.arc(0.625 * w, 0.5 * h, 5, 0, TAU);
  c.fill();

  // Black ink stamps on the panel that faces the viewer when the laces are up,
  // reading along the length of the ball
  c.save();
  c.translate(0.125 * w, 0.5 * h);
  c.rotate(Math.PI / 2);
  c.fillStyle = "rgba(12,6,3,0.82)";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "900 58px Arial Black, Arial, sans-serif";
  c.fillText("GRIDIRON", 0, -22);
  c.font = "700 22px Arial, sans-serif";
  c.fillText("OFFICIAL SIZE & WEIGHT", 0, 26);
  c.strokeStyle = "rgba(12,6,3,0.82)";
  c.lineWidth = 3;
  c.strokeRect(-190, -62, 380, 108);
  c.restore();

  return { color, bump };
}

export default function BettingBall() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return; // No WebGL: leave the space empty
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.className = styles.canvas;
      wrap.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 50);
      camera.position.set(0, 0.15, 5.5); // close enough to fill the stage, far enough for the flip to fit
      camera.lookAt(0, 0, 0);

      // Lighting: warm key, cool rim from behind, soft fill
      scene.add(new THREE.HemisphereLight(0xe8eeff, 0x2a1a10, 0.8));
      const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
      key.position.set(-3, 4, 5);
      const rim = new THREE.DirectionalLight(0x8fb4ff, 1.6);
      rim.position.set(4, 1.5, -4);
      const fill = new THREE.DirectionalLight(0xffffff, 0.45);
      fill.position.set(3, -2, 4);
      scene.add(key, rim, fill);

      // Ball body: a lathe around the long axis, turned to lie along x
      const profile: InstanceType<typeof THREE.Vector2>[] = [];
      const steps = 96;
      for (let i = 0; i <= steps; i++) {
        const x = -HALF_LENGTH + (2 * HALF_LENGTH * i) / steps;
        profile.push(new THREE.Vector2(Math.max(radiusAt(x), 0.0001), x));
      }
      const bodyGeo = new THREE.LatheGeometry(profile, 128);
      bodyGeo.rotateZ(Math.PI / 2);

      const { color, bump } = makeLeatherCanvases();
      const colorTex = new THREE.CanvasTexture(color);
      colorTex.colorSpace = THREE.SRGBColorSpace;
      colorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const bumpTex = new THREE.CanvasTexture(bump);
      const leather = new THREE.MeshPhysicalMaterial({
        map: colorTex,
        bumpMap: bumpTex,
        bumpScale: 3,
        roughness: 0.55,
        clearcoat: 0.25,
        clearcoatRoughness: 0.55,
      });
      const body = new THREE.Mesh(bodyGeo, leather);

      // Laces sit on the top seam: one long lace with eight cross laces over it
      const laceMat = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.55 });
      const laces = new THREE.Group();
      const longPts: InstanceType<typeof THREE.Vector3>[] = [];
      for (let i = 0; i <= 24; i++) {
        const x = -0.48 + (0.96 * i) / 24;
        longPts.push(new THREE.Vector3(x, radiusAt(x) + 0.008, 0));
      }
      const geos: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const longGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(longPts), 64, 0.018, 8, false);
      geos.push(longGeo);
      laces.add(new THREE.Mesh(longGeo, laceMat));
      for (let i = 0; i < 8; i++) {
        const x = -0.42 + i * 0.12;
        const r = radiusAt(x) + 0.022;
        const pts: InstanceType<typeof THREE.Vector3>[] = [];
        for (let j = 0; j <= 10; j++) {
          const a = -0.17 + (0.34 * j) / 10;
          pts.push(new THREE.Vector3(x, r * Math.cos(a), r * Math.sin(a)));
        }
        const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.024, 8, false);
        geos.push(g);
        laces.add(new THREE.Mesh(g, laceMat));
      }

      // Nesting: float (bob) > pose (yaw, tilt, roll) > spin (around the long axis)
      const spin = new THREE.Group();
      spin.add(body, laces);
      const pose = new THREE.Group();
      pose.add(spin);
      const float = new THREE.Group();
      float.add(pose);
      scene.add(float);

      // Soft shadow below the ball that shrinks as it rises
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = shadowCanvas.height = 128;
      const sc = shadowCanvas.getContext("2d")!;
      const sg = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
      sg.addColorStop(0, "rgba(0,0,0,0.55)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      sc.fillStyle = sg;
      sc.fillRect(0, 0, 128, 128);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
      const shadowGeo = new THREE.PlaneGeometry(3.2, 0.9);
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2.2;
      shadow.position.y = -1.35;
      scene.add(shadow);

      const apply = (p: Pose) => {
        float.position.y = p.y;
        pose.rotation.set(p.roll, p.yaw, p.tilt);
        spin.rotation.x = p.spin;
        const lift = (p.y + 0.1) / 0.2; // 0 at the lowest point, 1 at the highest
        shadow.scale.setScalar(1 - lift * 0.15);
        shadowMat.opacity = 0.9 - lift * 0.3;
      };

      const resize = () => {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      // Hover state: lock goes 0 (floating) to 1 (locked)
      let hovered = false;
      let lock = 0;
      let idleTime = 0.8;
      let target = lockedPose(idlePose(idleTime));
      const onEnter = () => {
        if (lock === 0) target = lockedPose(idlePose(idleTime));
        hovered = true;
      };
      const onLeave = () => (hovered = false);
      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointerleave", onLeave);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(wrap);

      let raf = 0;
      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!visible) return;

        if (reduceMotion) {
          // No motion: jump straight between the two poses
          lock = hovered ? 1 : 0;
        } else {
          lock = hovered ? Math.min(1, lock + dt / 0.9) : Math.max(0, lock - dt / 1.0);
          // Idle motion pauses while locked so letting go doesn't spin it wildly
          idleTime += dt * (1 - lock);
        }
        const eased = hovered ? easeOutBack(lock) : easeInOutCubic(lock);
        apply(mix(idlePose(idleTime), target, eased));
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        wrap.removeEventListener("pointerenter", onEnter);
        wrap.removeEventListener("pointerleave", onLeave);
        [bodyGeo, shadowGeo, ...geos].forEach((g) => g.dispose());
        [leather, laceMat, shadowMat].forEach((m) => m.dispose());
        [colorTex, bumpTex, shadowTex].forEach((t) => t.dispose());
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
      aria-label="A 3D football floating and slowly spinning; it flips and locks into place on hover"
    />
  );
}
