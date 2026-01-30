"use client";

import { Camera, Mesh, Plane, Program, Renderer, Transform, Vec2 } from "ogl";
import { useEffect, useRef } from "react";

export default function LiquidChrome({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Renderer({ alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    containerRef.current.appendChild(renderer.gl.canvas);

    const camera = new Camera(gl);
    camera.position.z = 1;

    const scene = new Transform();

    const geometry = new Plane(gl, { width: 2, height: 2, widthSegments: 20, heightSegments: 20 });

    const vertex = `
      attribute vec3 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragment = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 vUv;

      // Noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec2 uv = vUv;
        float noise = snoise(vec3(uv * 3.0, uTime * 0.2));
        float noise2 = snoise(vec3(uv * 5.0 + 100.0, uTime * 0.3));
        
        vec3 color1 = vec3(0.1, 0.1, 0.2); // Dark blue-ish
        vec3 color2 = vec3(0.5, 0.5, 0.6); // Metallic grey
        vec3 color3 = vec3(0.9, 0.9, 1.0); // Bright highlight
        
        float mixVal = smoothstep(-1.0, 1.0, noise + noise2 * 0.5);
        vec3 finalColor = mix(color1, color2, mixVal);
        finalColor = mix(finalColor, color3, smoothstep(0.4, 0.6, noise));
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(gl.canvas.width, gl.canvas.height) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    let animationId: number;
    function update(t: number) {
      animationId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene, camera });
    }
    animationId = requestAnimationFrame(update);

    function resize() {
      if (!containerRef.current) return;
      renderer.setSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
      program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();
    const container = containerRef.current;
    return () => {
      if (!container) return;
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
      // The original instruction included rendererRef.current, which is not defined.
      // Assuming the intent was to clean up the WebGL context if possible,
      // and remove the canvas from the DOM.
      // The renderer object itself is local to the useEffect, so we can use it directly.
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 h-full w-full ${className}`}
    />
  );
}
