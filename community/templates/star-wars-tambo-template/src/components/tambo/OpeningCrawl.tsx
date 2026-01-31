'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OpeningCrawlProps {
  title: string;
  episode?: number;
  content: string;
}

export function OpeningCrawl({ title, episode, content }: OpeningCrawlProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 20000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-hidden"
      onClick={() => setShow(false)}
    >
      <div className="relative w-full h-full perspective-1000">
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-[20vh]">
          {/* Episode number and title */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.5, 1.5, 1.5] }}
            transition={{ duration: 6 }}
            className="text-center mb-8"
          >
            {episode && (
              <p className="text-4xl md:text-5xl text-sw-blue mb-4">Episode {episode}</p>
            )}
            <h2 className="text-5xl md:text-7xl font-bold text-sw-yellow tracking-wider">
              {title}
            </h2>
          </motion.div>

          {/* Scrolling text */}
          <motion.div
            initial={{ top: '100%' }}
            animate={{ top: '-200%' }}
            transition={{ duration: 40, ease: 'linear' }}
            className="absolute w-full max-w-3xl px-8"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(25deg)',
              transformOrigin: 'center bottom',
            }}
          >
            <p className="text-xl md:text-2xl text-sw-yellow leading-relaxed text-center whitespace-pre-line">
              {content}
            </p>
          </motion.div>
        </div>

        {/* Click to skip hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0.5] }}
          transition={{ duration: 3, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm"
        >
          Click anywhere to skip
        </motion.div>
      </div>
    </motion.div>
  );
}
