'use client';

import { motion } from 'framer-motion';
import { Plane, Gauge, Users, Zap } from 'lucide-react';

interface StarshipCardProps {
  name: string;
  model: string;
  manufacturer: string;
  crew: string;
  passengers: string;
  maxSpeed: string;
  hyperdriveRating: string;
}

export function StarshipCard({
  name,
  model,
  manufacturer,
  crew,
  passengers,
  maxSpeed,
  hyperdriveRating,
}: StarshipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className="relative border-2 border-sw-yellow rounded-lg p-6 backdrop-blur-sm bg-gradient-to-br from-orange-950/40 to-black/40">
        {/* Animated corner accents */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <motion.div
            key={corner}
            className={`absolute w-4 h-4 border-sw-yellow ${
              corner.includes('top') ? 'top-2' : 'bottom-2'
            } ${corner.includes('left') ? 'left-2' : 'right-2'} ${
              corner.includes('top') && corner.includes('left')
                ? 'border-t-2 border-l-2'
                : corner.includes('top') && corner.includes('right')
                  ? 'border-t-2 border-r-2'
                  : corner.includes('bottom') && corner.includes('left')
                    ? 'border-b-2 border-l-2'
                    : 'border-b-2 border-r-2'
            }`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}

        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-sw-yellow"
            >
              <Plane className="w-8 h-8" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-sw-yellow glow-text mb-1">{name}</h3>
              <p className="text-sm text-gray-300">{model}</p>
              <p className="text-xs text-gray-400">{manufacturer}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-black/30 rounded p-3 border border-sw-yellow/20">
              <div className="flex items-center gap-2 text-sw-yellow/70 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase">Crew</span>
              </div>
              <p className="text-lg font-semibold text-white">{crew}</p>
            </div>

            <div className="bg-black/30 rounded p-3 border border-sw-yellow/20">
              <div className="flex items-center gap-2 text-sw-yellow/70 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase">Passengers</span>
              </div>
              <p className="text-lg font-semibold text-white">{passengers}</p>
            </div>

            <div className="bg-black/30 rounded p-3 border border-sw-yellow/20">
              <div className="flex items-center gap-2 text-sw-yellow/70 mb-1">
                <Gauge className="w-4 h-4" />
                <span className="text-xs uppercase">Max Speed</span>
              </div>
              <p className="text-sm font-semibold text-white">{maxSpeed}</p>
            </div>

            <div className="bg-black/30 rounded p-3 border border-sw-yellow/20">
              <div className="flex items-center gap-2 text-sw-yellow/70 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs uppercase">Hyperdrive</span>
              </div>
              <p className="text-lg font-semibold text-white">{hyperdriveRating}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Outer glow effect */}
      <div className="absolute inset-0 rounded-lg bg-sw-yellow/10 blur-xl -z-10" />
    </motion.div>
  );
}
