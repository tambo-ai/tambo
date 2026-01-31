"use client";

import React from "react";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Github, Globe } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { SpeakerCardProps } from "@/types";
import { speakersData } from "@/lib/mock-data";

export const SpeakerCard: React.FC<SpeakerCardProps> = (props) => {
  // Find speaker by ID or use first speaker as default
  const speaker = props.speakerId 
    ? speakersData.find(s => s.id === props.speakerId) || speakersData[0]
    : speakersData[0];

  // Use props if provided, otherwise fall back to speaker data
  const name = props.name || speaker.name;
  const role = props.role || speaker.role;
  const company = props.company || speaker.company;
  const bio = props.bio || speaker.bio;
  const image = props.image || speaker.image;
  // Always use speaker data for these complex fields
  const expertise = speaker.expertise;
  const social = speaker.social;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full">
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600" />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-200">
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="pt-14 pb-6 px-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {name}
          </h3>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-1">
            {role}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {company}
          </p>

          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
            {bio}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {expertise.map((skill) => (
              <Badge key={skill} variant="primary" size="sm">
                {skill}
              </Badge>
            ))}
          </div>

          {social && (
            <div className="flex justify-center gap-3">
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {social.github && (
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {social.website && (
                <a
                  href={social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default SpeakerCard;
