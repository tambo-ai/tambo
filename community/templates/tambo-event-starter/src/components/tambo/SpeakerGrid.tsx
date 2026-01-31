"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { SpeakerGridProps } from "@/types";
import { SpeakerCard } from "./SpeakerCard";
import { speakersData } from "@/lib/mock-data";

export const SpeakerGrid: React.FC<SpeakerGridProps> = ({
  filterExpertise,
}) => {
  // Use mock data directly
  const speakers = speakersData;
  
  const filteredSpeakers = filterExpertise
    ? speakers.filter((s) =>
        s.expertise.some((e) =>
          e.toLowerCase().includes(filterExpertise.toLowerCase())
        )
      )
    : speakers;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Our Speakers</h3>
              <p className="text-purple-100 text-sm">
                {filteredSpeakers.length} amazing speakers
                {filterExpertise && ` in ${filterExpertise}`}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {filteredSpeakers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No speakers found{filterExpertise && ` for "${filterExpertise}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpeakers.map((speaker, index) => (
                <motion.div
                  key={speaker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SpeakerCard
                    speakerId={speaker.id}
                    name={speaker.name}
                    role={speaker.role}
                    company={speaker.company}
                    bio={speaker.bio}
                    image={speaker.image}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SpeakerGrid;
