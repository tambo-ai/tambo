'use client'

import { useEffect, useRef, useState } from 'react'

interface WaveformProps {
  data?: number[]
  frequency?: number
  amplitude?: number
  className?: string
}

export function Waveform({ data, frequency = 10, amplitude = 50, className = '' }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const [dimensions, setDimensions] = useState({ width: 400, height: 100 })
  
  const bufferRef = useRef<number[]>([])
  const scrollOffsetRef = useRef(0)
  const lastUpdateTimeRef = useRef(Date.now())
  const timeRef = useRef(0)
  const lastFreqRef = useRef<number>(frequency || 10)
  
  // Simple heart rate monitor: 1 cm wavelength
  const SAMPLES_PER_SECOND = 100
  const PIXELS_PER_SECOND = 50
  const WAVELENGTH_PIXELS = 38 // 1 cm

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateDimensions = () => {
      const container = canvas.parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: rect.height,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use provided frequency or default to 1 cm wavelength
    const baseWaveFreq = PIXELS_PER_SECOND / WAVELENGTH_PIXELS
    // Scale frequency based on prop (frequency is in Hz, we need to convert to our pixel-based frequency)
    // Higher frequency = more waves per second = shorter wavelength
    const effectiveFreq = frequency ? (frequency / 10) * baseWaveFreq : baseWaveFreq

    // Initialize buffer
    if (bufferRef.current.length === 0) {
      for (let i = 0; i < SAMPLES_PER_SECOND * 10; i++) {
        const t = i / SAMPLES_PER_SECOND
        const value = 0.5 + 0.5 * Math.sin(2 * Math.PI * effectiveFreq * t)
        bufferRef.current.push(value)
      }
    }

    const draw = () => {
      const now = Date.now()
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000
      lastUpdateTimeRef.current = now

      canvas.width = dimensions.width
      canvas.height = dimensions.height

      // Black background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      
      for (let i = 0; i <= 4; i++) {
        const y = (canvas.height / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      
      ctx.setLineDash([])

      const centerY = canvas.height / 2
      const waveHeight = canvas.height * 0.6
      
      // Use provided frequency or default
      const baseWaveFreq = PIXELS_PER_SECOND / WAVELENGTH_PIXELS
      const currentFreq = frequency || 10
      const effectiveFreq = (currentFreq / 10) * baseWaveFreq
      
      // When frequency changes, clear buffer to regenerate with new frequency
      if (lastFreqRef.current !== currentFreq) {
        bufferRef.current = []
        timeRef.current = 0
        lastFreqRef.current = currentFreq
      }
      
      // Generate new samples
      const samplesToAdd = Math.floor(deltaTime * SAMPLES_PER_SECOND)
      for (let i = 0; i < samplesToAdd; i++) {
        const t = (bufferRef.current.length + i) / SAMPLES_PER_SECOND
        const value = 0.5 + 0.5 * Math.sin(2 * Math.PI * effectiveFreq * t + timeRef.current)
        bufferRef.current.push(value)
      }

      // Remove old samples
      const maxBufferSize = Math.ceil((canvas.width / PIXELS_PER_SECOND) * SAMPLES_PER_SECOND) + SAMPLES_PER_SECOND
      if (bufferRef.current.length > maxBufferSize) {
        bufferRef.current = bufferRef.current.slice(-maxBufferSize)
      }

      // Update scroll
      scrollOffsetRef.current += deltaTime * PIXELS_PER_SECOND
      if (scrollOffsetRef.current > PIXELS_PER_SECOND * 2) {
        scrollOffsetRef.current = scrollOffsetRef.current % (PIXELS_PER_SECOND * 2)
      }

      // Update time
      timeRef.current += deltaTime * effectiveFreq

      // Draw simple waveform with amplitude scaling
      const pixelsPerSample = PIXELS_PER_SECOND / SAMPLES_PER_SECOND
      const amplitudeScale = (amplitude / 100) * (waveHeight / 2) || (waveHeight / 2)
      
      ctx.beginPath()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      let firstPoint = true
      bufferRef.current.forEach((value, index) => {
        const x = canvas.width - (bufferRef.current.length - index) * pixelsPerSample + scrollOffsetRef.current
        if (x < -10 || x > canvas.width + 10) return
        
        const normalizedValue = (value - 0.5) * 2
        const y = centerY - (normalizedValue * amplitudeScale)
        
        if (firstPoint) {
          ctx.moveTo(x, y)
          firstPoint = false
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [data, frequency, amplitude, dimensions])

  return (
    <div className={`nl-card ${className}`}>
      <div className="relative rounded-lg overflow-hidden" style={{ height: '280px' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}
