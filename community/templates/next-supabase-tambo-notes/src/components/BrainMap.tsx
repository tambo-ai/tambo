'use client'

import { useState } from 'react'

interface BrainMapProps {
  regions?: Record<string, { x: number; y: number; label: string; active?: boolean; activity?: number }>
  onRegionClick?: (regionId: string) => void
  className?: string
}

// 6 regions positioned on brain silhouette: frontal, motor, visual, auditory, limbic, parietal
const BRAIN_REGIONS_LAYOUT: Record<string, { x: number; y: number; label: string; regionId: string }> = {
  frontal: { x: 50, y: 25, label: 'Frontal', regionId: 'frontal' },
  motor: { x: 50, y: 45, label: 'Motor', regionId: 'frontal' }, // Motor maps to frontal
  visual: { x: 50, y: 75, label: 'Visual', regionId: 'occipital' },
  auditory: { x: 30, y: 50, label: 'Auditory', regionId: 'temporal' },
  limbic: { x: 50, y: 60, label: 'Limbic', regionId: 'cerebellum' }, // Limbic maps to cerebellum
  parietal: { x: 70, y: 50, label: 'Parietal', regionId: 'parietal' },
}

// Connections between regions
const CONNECTIONS = [
  ['frontal', 'motor'],
  ['motor', 'parietal'],
  ['motor', 'auditory'],
  ['parietal', 'visual'],
  ['limbic', 'motor'],
]

export function BrainMap({ regions = {}, onRegionClick, className = '' }: BrainMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId)
    if (onRegionClick) {
      const regionInfo = BRAIN_REGIONS_LAYOUT[nodeId]
      if (regionInfo) {
        onRegionClick(regionInfo.regionId)
      }
    }
  }

  // Get activity value (0-1) for a region
  const getActivityValue = (nodeId: string): number => {
    const regionInfo = BRAIN_REGIONS_LAYOUT[nodeId]
    if (!regionInfo) return 0
    
    const regionData = regions[regionInfo.regionId]
    if (!regionData) return 0
    
    // Prefer explicit activity value (0-1) if available
    if (typeof regionData === 'object' && 'activity' in regionData && typeof regionData.activity === 'number') {
      return Math.min(1, Math.max(0, regionData.activity))
    }
    // Fallback to active boolean
    if (typeof regionData === 'object' && 'active' in regionData) {
      return regionData.active ? 1 : 0
    }
    // If it's a number, normalize to 0-1 (assuming 0-100 range)
    if (typeof regionData === 'number') {
      return Math.min(1, Math.max(0, regionData / 100))
    }
    return 0
  }

  return (
    <div className={`nl-card p-6 ${className}`}>
      <div className="relative w-full" style={{ height: '400px' }}>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Brain Silhouette Background */}
          <ellipse
            cx="50"
            cy="50"
            rx="35"
            ry="42"
            fill="rgba(0, 0, 0, 0.3)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Brain outline - more detailed shape */}
          <path
            d="M 50 8 Q 60 8 65 15 Q 68 25 65 35 Q 62 40 58 42 Q 55 45 50 45 Q 45 45 42 42 Q 38 40 35 35 Q 32 25 35 15 Q 40 8 50 8 Z"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="0.3"
          />
          <path
            d="M 50 45 Q 55 50 58 55 Q 60 65 58 75 Q 55 80 50 82 Q 45 80 42 75 Q 40 65 42 55 Q 45 50 50 45 Z"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="0.3"
          />
          
          {/* Subtle dotted boundary ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.3"
            strokeDasharray="1, 2"
          />

          {/* Connection lines */}
          {CONNECTIONS.map(([from, to], idx) => {
            const fromNode = BRAIN_REGIONS_LAYOUT[from]
            const toNode = BRAIN_REGIONS_LAYOUT[to]
            if (!fromNode || !toNode) return null

            const fromActivity = getActivityValue(from)
            const toActivity = getActivityValue(to)
            const isActive = fromActivity > 0 || toActivity > 0
            const avgActivity = (fromActivity + toActivity) / 2

            return (
              <line
                key={`${from}-${to}-${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#ffffff"
                strokeWidth={0.2 + avgActivity * 0.3}
                opacity={0.2 + avgActivity * 0.4}
                style={{
                  filter: isActive ? `drop-shadow(0 0 ${2 + avgActivity * 2}px rgba(255, 255, 255, ${0.3 + avgActivity * 0.3}))` : 'none',
                }}
              />
            )
          })}

          {/* Region Nodes - 6 circles positioned on brain silhouette */}
          {Object.entries(BRAIN_REGIONS_LAYOUT).map(([nodeId, node]) => {
            const activity = getActivityValue(nodeId) // 0-1 value
            const isHovered = hoveredNode === nodeId
            const isSelected = selectedNode === nodeId
            const displayValue = Math.round(activity * 100)

            // Color intensity reflects activity (0-1)
            // White when active, gray when inactive
            const fillOpacity = 0.2 + activity * 0.8
            const strokeOpacity = 0.3 + activity * 0.7
            const glowIntensity = activity

            return (
              <g key={nodeId}>
                {/* Outer glow - intensity based on activity */}
                {activity > 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.3"
                    opacity={0.2 + glowIntensity * 0.3}
                    style={{
                      filter: `drop-shadow(0 0 ${2 + glowIntensity * 3}px rgba(255, 255, 255, ${0.4 + glowIntensity * 0.4}))`,
                      animation: activity > 0.5 ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}
                  />
                )}

                {/* Main region circle - color intensity reflects activity (0-1) */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? '3.5' : isHovered ? '3.2' : '3'}
                  fill={`rgba(255, 255, 255, ${fillOpacity})`}
                  stroke={`rgba(255, 255, 255, ${strokeOpacity})`}
                  strokeWidth={isSelected ? '0.4' : '0.2'}
                  style={{
                    filter: activity > 0
                      ? `drop-shadow(0 0 ${2 + glowIntensity * 4}px rgba(255, 255, 255, ${0.6 + glowIntensity * 0.4}))`
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={() => setHoveredNode(nodeId)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(nodeId)}
                />

                {/* Activity value number inside node (0-100) */}
                {activity > 0.1 && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2.5"
                    fill={activity > 0.5 ? '#000000' : '#ffffff'}
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {displayValue}
                  </text>
                )}

                {/* Label below node */}
                <text
                  x={node.x}
                  y={node.y + 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2"
                  fill="#888888"
                  pointerEvents="none"
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
