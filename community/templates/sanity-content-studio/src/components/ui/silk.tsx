"use client";

import { Camera, Mesh, Plane, Program, Renderer, Transform, Vec2 } from "ogl";
import { useEffect, useRef } from "react";

export default function Silk({ className }: { className?: string }) {
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

    const geometry = new Plane(gl, { width: 2, height: 2 });

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

      void main() {
        vec2 uv = vUv;
        // Zoom out a bit
        uv = uv * 2.0 - 0.5;
        
        for(float i = 1.0; i < 8.0; i++){
            uv.x += 0.3 / i * sin(i * 3.0 * uv.y + uTime * 0.5);
            uv.y += 0.3 / i * cos(i * 3.0 * uv.x + uTime * 0.5);
        }
        
        // Base pattern
        float pattern = sin(uv.x * 2.0) * 0.5 + 0.5;
        
        // Silk colors - Grey scale with metallic finish
        vec3 color = vec3(pattern * 0.5 + 0.25);
        
        // Add subtle noise/texture
        color += 0.05 * sin(uv.y * 50.0);
        
        gl_FragColor = vec4(color, 1.0);
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
      program.uniforms.uTime.value = t * 0.0005;
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
      cancelAnimationFrame(animationId); // Keep existing animation frame cleanup
      if (renderer) { // Use the 'renderer' constant from the effect scope
        renderer.gl.getExtension("WEBGL_lose_context")?.loseContext(); // Correct extension name
      }
      if (container.contains(gl.canvas)) { // Use the captured 'container'
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
