'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    THREE: any
  }
}

export function Neural3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const animationFrameRef = useRef<number>()
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let scene: any, camera: any, renderer: any, brain: any, silhouette: any
    let mouseX = 0, mouseY = 0
    let windowHalfX = window.innerWidth / 2
    let windowHalfY = window.innerHeight / 2
    let handleResize: (() => void) | null = null
    let handleMouseMove: ((e: MouseEvent) => void) | null = null

    // Load Three.js from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.async = true

    script.onload = () => {
      const THREE = (window as any).THREE
      if (!THREE) return

      // Initialize scene
      scene = new THREE.Scene()
      
      camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.set(0, 0, 10)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      containerRef.current?.appendChild(renderer.domElement)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x000000, 0.5)
      scene.add(ambientLight)

      const pointLight = new THREE.PointLight(0xffffff, 2, 20)
      pointLight.position.set(2, 2, 2)
      scene.add(pointLight)
      
      const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 20)
      pointLight2.position.set(-2, -2, 2)
      scene.add(pointLight2)

      // 1. IMPROVED ANATOMICAL SILHOUETTE
      const headGeo = new THREE.IcosahedronGeometry(2.8, 6)
      const pos = headGeo.attributes.position
      const v = new THREE.Vector3()

      for(let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        
        // Sculpting a more human profile
        // Narrow the temple area
        if(Math.abs(v.x) > 1) v.x *= 0.8
        // Elongate the jaw and neck
        if(v.y < -0.5) {
          v.y *= 1.2
          v.x *= (1.0 - (Math.abs(v.y) - 0.5) * 0.2)
        }
        // Forehead slant
        if(v.y > 1 && v.z > 0) v.z *= 1.1
        // Occipital bone (back of head) bulge
        if(v.y < 1 && v.y > -1 && v.z < 0) v.z *= 1.15

        pos.setXYZ(i, v.x, v.y, v.z)
      }

      const headMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        shininess: 80,
        specular: 0xffffff,
        side: THREE.DoubleSide
      })
      
      silhouette = new THREE.Mesh(headGeo, headMat)
      scene.add(silhouette)

      // 2. REFINED BRAIN SHAPE
      const brainGroup = new THREE.Group()
      
      const createDetailedLobe = (size: number, posVec: any, scaleVec: any, isCerebellum = false) => {
        const geo = new THREE.SphereGeometry(size, 80, 80)
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 1.8,
          roughness: 0.2,
          metalness: 0.1
        })
        
        const p = geo.attributes.position
        const vertex = new THREE.Vector3()
        for(let i = 0; i < p.count; i++) {
          vertex.fromBufferAttribute(p, i)
          
          // Complex Sulci/Gyri simulation using multiple sine layers
          const fold1 = Math.sin(vertex.x * 12) * Math.cos(vertex.y * 12) * Math.sin(vertex.z * 12) * 0.06
          const fold2 = Math.sin(vertex.x * 25) * 0.02
          const noise = fold1 + fold2
          
          vertex.multiplyScalar(1 + noise)
          p.setXYZ(i, vertex.x, vertex.y, vertex.z)
        }
        
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.copy(posVec)
        mesh.scale.copy(scaleVec)
        return mesh
      }

      // Anatomical placement
      const leftCerebrum = createDetailedLobe(1, new THREE.Vector3(-0.45, 0.9, 0.1), new THREE.Vector3(0.9, 0.75, 1.3))
      const rightCerebrum = createDetailedLobe(1, new THREE.Vector3(0.45, 0.9, 0.1), new THREE.Vector3(0.9, 0.75, 1.3))
      const cerebellum = createDetailedLobe(0.65, new THREE.Vector3(0, 0.2, -1.0), new THREE.Vector3(1.4, 0.8, 0.9))
      const brainStem = createDetailedLobe(0.35, new THREE.Vector3(0, -0.6, -0.4), new THREE.Vector3(0.8, 3.0, 0.8))

      brainGroup.add(leftCerebrum, rightCerebrum, cerebellum, brainStem)
      scene.add(brainGroup)
      brain = brainGroup

      // 3. INTERNAL GLOW PARTICLES
      const pGeo = new THREE.BufferGeometry()
      const pCount = 800
      const pPos = new Float32Array(pCount * 3)
      for(let i = 0; i < pCount; i++) {
        pPos[i*3] = (Math.random() - 0.5) * 1.5
        pPos[i*3+1] = (Math.random() - 0.5) * 1.2 + 0.8
        pPos[i*3+2] = (Math.random() - 0.5) * 1.8 - 0.2
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      const pMat = new THREE.PointsMaterial({
        size: 0.015,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      })
      const particles = new THREE.Points(pGeo, pMat)
      brain.add(particles)

      sceneRef.current = { scene, camera, renderer, brain, silhouette }

      // Event Listeners
      handleResize = () => {
        windowHalfX = window.innerWidth / 2
        windowHalfY = window.innerHeight / 2
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - windowHalfX) * 0.0005
        mouseY = (e.clientY - windowHalfY) * 0.0005
      }

      window.addEventListener('resize', handleResize)
      document.addEventListener('mousemove', handleMouseMove)

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate)

        const time = Date.now() * 0.001

        // Gentle rotation and hover
        scene.rotation.y += (mouseX - scene.rotation.y) * 0.05
        scene.rotation.x += (mouseY - scene.rotation.x) * 0.05
        
        // Pulsing logic
        const pulse = 1.6 + Math.sin(time * 2) * 0.4
        brain.children.forEach((child: any, i: number) => {
          if(child.material && child.material.emissiveIntensity) {
            child.material.emissiveIntensity = pulse + Math.sin(time * 3 + i) * 0.2
          }
          // Subtly move lobes
          if(child.isMesh) {
            child.position.y += Math.sin(time + i) * 0.0005
          }
        })

        // Silhouette subtle highlight cycle
        silhouette.material.opacity = 0.2 + Math.sin(time * 0.5) * 0.05

        renderer.render(scene, camera)
      }

      animate()

      // Store cleanup function
      cleanupRef.current = () => {
        if (handleResize) window.removeEventListener('resize', handleResize)
        if (handleMouseMove) document.removeEventListener('mousemove', handleMouseMove)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (renderer && containerRef.current && renderer.domElement.parentNode) {
          containerRef.current.removeChild(renderer.domElement)
          renderer.dispose()
        }
      }
    }

    document.head.appendChild(script)

    // Main cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.innerHTML = ''
      }
      // Remove script if still in head
      const existingScript = document.querySelector('script[src*="three.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
