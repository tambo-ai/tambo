'use client';

import { motion } from 'framer-motion';
import { Users, Zap, Shield } from 'lucide-react';

interface CharacterCardProps {
  name: string;
  species: string;
  homeworld: string;
  affiliation: 'light' | 'dark' | 'neutral';
  forceStrength?: number;
}

export function CharacterCard({
  name,
  species,
  homeworld,
  affiliation,
  forceStrength = 0,
}: CharacterCardProps) {
  const affiliationColors = {
    light: 'text-sw-light border-sw-light',
    dark: 'text-sw-dark border-sw-dark',
    neutral: 'text-sw-yellow border-sw-yellow',
  };

  const affiliationIcons = {
    light: <Shield className="w-6 h-6" />,
    dark: <Zap className="w-6 h-6" />,
    neutral: <Users className="w-6 h-6" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div
        className={`relative border-2 rounded-lg p-6 backdrop-blur-sm bg-black/40 hologram-effect ${affiliationColors[affiliation]}`}
      >
        {/* Hologram scan lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-px bg-current opacity-20"
              initial={{ top: `${i * 20}%` }}
              animate={{ top: [`${i * 20}%`, `${(i * 20 + 100) % 100}%`] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold glow-text mb-1">{name}</h3>
              <p className="text-sm opacity-80">{species}</p>
            </div>
            <div className="animate-pulse-glow">{affiliationIcons[affiliation]}</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-current/20">
              <span className="opacity-70">Homeworld</span>
              <span className="font-semibold">{homeworld}</span>
            </div>

            {forceStrength > 0 && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="opacity-70">Force Strength</span>
                  <span className="font-semibold">{forceStrength}/10</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-current rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${forceStrength * 10}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 text-xs opacity-60 uppercase tracking-wider">
              {affiliation === 'light' && '✦ Light Side'}
              {affiliation === 'dark' && '✦ Dark Side'}
              {affiliation === 'neutral' && '✦ Neutral'}
            </div>
          </div>
        </div>
      </div>

      {/* Outer glow */}
      <div
        className={`absolute inset-0 rounded-lg blur-xl opacity-20 ${affiliationColors[affiliation]} -z-10`}
      />
    </motion.div>
  );
}
