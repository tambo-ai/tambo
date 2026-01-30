export type RegionId = 'frontal' | 'parietal' | 'occipital' | 'temporal' | 'cerebellum' | 'brainstem'

export interface Region {
  id: RegionId
  label: string
  x: number
  y: number
}

export const BRAIN_REGIONS: Record<RegionId, Region> = {
  frontal: {
    id: 'frontal',
    label: 'Frontal',
    x: 200,
    y: 100,
  },
  parietal: {
    id: 'parietal',
    label: 'Parietal',
    x: 200,
    y: 150,
  },
  occipital: {
    id: 'occipital',
    label: 'Occipital',
    x: 200,
    y: 200,
  },
  temporal: {
    id: 'temporal',
    label: 'Temporal',
    x: 150,
    y: 150,
  },
  cerebellum: {
    id: 'cerebellum',
    label: 'Cerebellum',
    x: 200,
    y: 250,
  },
  brainstem: {
    id: 'brainstem',
    label: 'Brainstem',
    x: 200,
    y: 300,
  },
}

