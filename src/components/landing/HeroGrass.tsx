"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroGrass.module.css";

// Realistic grass for the hero: ~150k instanced blades with wind gusts rolling across,
// mowed stripes, and yard lines and hash marks painted onto the blades themselves.
// The CSS field background underneath shows if WebGL isn't available.

const LINE_SPACING = 2.0; // world units between yard lines (5 yards)
// Blades fill the camera's whole view of the ground, which widens with distance
const FIELD = { minZ: -12.5, maxZ: 3.5 };
const halfWidthAt = (z: number) => 8 + (FIELD.maxZ - z) * 0.9;
// The bare ground reaches further so the far edge fades into haze instead of ending

// Shared color logic for blades and the ground under them.
// root = where the blade is planted; h = 0 at the base, 1 at the tip.
const fieldColor = /* glsl */ `
  uniform float uLineSpacing;

  float onYardLine(vec2 root) {
    float d = abs(mod(root.x + uLineSpacing * 0.5, uLineSpacing) - uLineSpacing * 0.5);
    return step(d, 0.055);
  }

  float onHashMark(vec2 root) {
    float yard = uLineSpacing / 5.0;
    float d = abs(mod(root.x + yard * 0.5, yard) - yard * 0.5);
    float tick = step(d, 0.03);
    float rowNear = step(abs(root.y - 1.2), 0.16);
    float rowFar = step(abs(root.y + 6.0), 0.2);
    return tick * max(rowNear, rowFar);
  }

  vec3 grassColor(vec2 root, float h, float shade, float gust) {
    float stripe = mod(floor(root.x / uLineSpacing), 2.0);
    vec3 base = mix(vec3(0.045, 0.15, 0.05), vec3(0.06, 0.18, 0.055), stripe);
    vec3 tip = mix(vec3(0.27, 0.50, 0.17), vec3(0.34, 0.58, 0.21), stripe);
    vec3 col = mix(base, tip, smoothstep(0.0, 1.0, h)) * (0.8 + shade * 0.4);
    // Blades bent by a gust tilt toward the light and look brighter
    col += vec3(0.10, 0.13, 0.05) * gust * h;
    float paint = max(onYardLine(root), onHashMark(root));
    vec3 white = mix(vec3(0.70), vec3(0.97), h) * (0.88 + shade * 0.12);
    return mix(col, white, paint);
  }
`;

const bladeVertex = /* glsl */ `
  attribute vec3 offset;
  attribute float yaw;
  attribute float hScale;
  attribute float shade;
  uniform float uTime;
  varying float vH;
  varying float vShade;
  varying float vGust;
  varying vec2 vRoot;
  varying float vDepth;

  void main() {
    float h = position.y;
    vec3 p = position;
    p.x *= 1.0 - h * 0.92;           // taper to a point
    p.y *= hScale;
    float c = cos(yaw), s = sin(yaw);
    p = vec3(p.x * c, p.y, p.x * s);
    vec3 world = offset + p;

    // Wind: broad gusts travel across the field, plus a small per-blade flutter
    float gust = sin(dot(offset.xz, vec2(0.33, 0.21)) - uTime * 1.5) * 0.5 + 0.5;
    gust = gust * gust * (0.7 + 0.3 * sin(offset.x * 0.11 + uTime * 0.37));
    float flutter = sin(uTime * 3.7 + offset.x * 3.1 + offset.z * 2.3) * 0.12;
    float bend = (0.15 + gust * 0.55 + flutter) * h * h * hScale;
    world.x += bend * 0.75;
    world.z += bend * 0.35;
    world.y -= bend * bend * 0.35;

    vH = h;
    vShade = shade;
    vGust = gust;
    vRoot = offset.xz;
    vec4 view = viewMatrix * vec4(world, 1.0);
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const bladeFragment = /* glsl */ `
  varying float vH;
  varying float vShade;
  varying float vGust;
  varying vec2 vRoot;
  varying float vDepth;
  ${fieldColor}

  void main() {
    vec3 col = grassColor(vRoot, vH, vShade, vGust);
    // Haze in the distance
    col = mix(col, vec3(0.13, 0.27, 0.12), smoothstep(12.0, 26.0, vDepth));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const groundVertex = /* glsl */ `
  varying vec2 vRoot;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vRoot = world.xz;
    vec4 view = viewMatrix * world;
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const groundFragment = /* glsl */ `
  varying vec2 vRoot;
  varying float vDepth;
  ${fieldColor}
  void main() {
    vec3 col = grassColor(vRoot, 0.15, 0.3, 0.0) * 0.8;
    col = mix(col, vec3(0.13, 0.27, 0.12), smoothstep(12.0, 26.0, vDepth));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function HeroGrass() {
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
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        return; // No WebGL: the CSS field stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // shader colors are already display colors
      renderer.domElement.className = styles.canvas;
      wrap.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 2.7, 0.1, 60);
      // Steep enough that the top of the view still lands on the field (no horizon)
      camera.position.set(0, 5.5, 6.0);
      camera.lookAt(0, 0, -1);

      const uniforms = { uTime: { value: 0 }, uLineSpacing: { value: LINE_SPACING } };

      // Ground under the blades so gaps read as dense turf
      const groundGeo = new THREE.PlaneGeometry(90, 80);
      groundGeo.rotateX(-Math.PI / 2);
      groundGeo.translate(0, 0, -32);
      const groundMat = new THREE.ShaderMaterial({ uniforms, vertexShader: groundVertex, fragmentShader: groundFragment });
      scene.add(new THREE.Mesh(groundGeo, groundMat));

      // One blade: a thin strip 0..1 tall with 4 segments so it can bend smoothly
      const blade = new THREE.PlaneGeometry(0.045, 1, 1, 4);
      blade.translate(0, 0.5, 0);
      const geo = new THREE.InstancedBufferGeometry();
      geo.index = blade.index;
      geo.setAttribute("position", blade.getAttribute("position"));

      // Fewer blades on small screens
      const count = window.innerWidth < 700 ? 80000 : 220000;
      const offsets = new Float32Array(count * 3);
      const yaws = new Float32Array(count);
      const scales = new Float32Array(count);
      const shades = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const z = FIELD.minZ + Math.random() * (FIELD.maxZ - FIELD.minZ);
        offsets[i * 3] = (Math.random() * 2 - 1) * halfWidthAt(z);
        offsets[i * 3 + 1] = 0;
        offsets[i * 3 + 2] = z;
        yaws[i] = Math.random() * Math.PI;
        scales[i] = 0.12 + Math.random() * 0.1; // short, mowed turf
        shades[i] = Math.random();
      }
      geo.setAttribute("offset", new THREE.InstancedBufferAttribute(offsets, 3));
      geo.setAttribute("yaw", new THREE.InstancedBufferAttribute(yaws, 1));
      geo.setAttribute("hScale", new THREE.InstancedBufferAttribute(scales, 1));
      geo.setAttribute("shade", new THREE.InstancedBufferAttribute(shades, 1));
      geo.instanceCount = count;
      const bladeMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: bladeVertex,
        fragmentShader: bladeFragment,
        side: THREE.DoubleSide,
      });
      const grass = new THREE.Mesh(geo, bladeMat);
      grass.frustumCulled = false;
      scene.add(grass);

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

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(wrap);

      const start = performance.now();
      let raf = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) return;
        uniforms.uTime.value = (now - start) / 1000;
        renderer.render(scene, camera);
      };
      if (reduceMotion) {
        uniforms.uTime.value = 2;
        renderer.render(scene, camera);
      } else {
        raf = requestAnimationFrame(frame);
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        [groundGeo, blade, geo].forEach((g) => g.dispose());
        [groundMat, bladeMat].forEach((m) => m.dispose());
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
    <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
      {/* Darkens the left side so the headline stays readable over the grass */}
      <div className={styles.shade} />
    </div>
  );
}
