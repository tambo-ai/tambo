"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { EventHeroProps } from "@/types";
import { formatDateRange } from "@/lib/utils";
import { eventData } from "@/lib/mock-data";

export const EventHero: React.FC<EventHeroProps> = (props) => {
  // Use props if provided, otherwise fall back to mock data
  const name = props.name || eventData.name;
  const tagline = props.tagline || eventData.tagline;
  const type = props.type || eventData.type;
  const startDate = props.startDate || eventData.dates.start;
  const endDate = props.endDate || eventData.dates.end;
  const venue = props.venue || eventData.venue.name;
  const spotsRemaining = props.spotsRemaining ?? eventData.spotsRemaining;
  const isRegistrationOpen = props.isRegistrationOpen ?? eventData.isRegistrationOpen;
  const eventTypeColors = {
    hackathon: "from-indigo-600 via-purple-600 to-pink-500",
    conference: "from-blue-600 via-cyan-600 to-teal-500",
    workshop: "from-amber-500 via-orange-500 to-red-500",
  };

  const eventTypeLabels = {
    hackathon: "🚀 Hackathon",
    conference: "🎤 Conference",
    workshop: "🛠️ Workshop",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${eventTypeColors[type]} opacity-20 blur-3xl`} />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-indigo-500/20 to-transparent blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="primary" size="md">
            {eventTypeLabels[type]}
          </Badge>
          {isRegistrationOpen ? (
            <Badge variant="success" size="md">
              ✅ Registration Open
            </Badge>
          ) : (
            <Badge variant="danger" size="md">
              🔒 Registration Closed
            </Badge>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
        >
          {name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 mb-6"
        >
          {tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <div>
              <p className="text-sm text-gray-400">Date</p>
              <p className="font-semibold">{formatDateRange(startDate, endDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
            <MapPin className="w-6 h-6 text-pink-400" />
            <div>
              <p className="text-sm text-gray-400">Venue</p>
              <p className="font-semibold">{venue}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
            <Users className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Spots Left</p>
              <p className="font-semibold">{spotsRemaining} available</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
            <Clock className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="font-semibold">48 Hours</p>
            </div>
          </div>
        </motion.div>

        {isRegistrationOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button size="lg" className="w-full md:w-auto">
              Register Now 🎉
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default EventHero;
