"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, User, ChevronDown } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { ScheduleViewProps, Session, SessionType } from "@/types";
import { formatTime } from "@/lib/utils";
import { scheduleData } from "@/lib/mock-data";

const sessionTypeConfig: Record<SessionType, { color: string; icon: string }> = {
  keynote: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300", icon: "🎤" },
  workshop: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300", icon: "🛠️" },
  talk: { color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300", icon: "💬" },
  panel: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300", icon: "👥" },
  networking: { color: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300", icon: "🤝" },
  break: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: "☕" },
  ceremony: { color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300", icon: "🎉" },
  hackathon: { color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300", icon: "💻" },
};

const SessionCard: React.FC<{ session: Session; index: number }> = ({ session, index }) => {
  const config = sessionTypeConfig[session.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col items-center min-w-[70px]">
        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {formatTime(session.startTime)}
        </span>
        <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-1" />
        <span className="text-sm text-gray-400">
          {formatTime(session.endTime)}
        </span>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.icon} {session.type}
          </span>
          {session.track && (
            <Badge variant="default" size="sm">{session.track}</Badge>
          )}
        </div>

        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          {session.title}
        </h4>

        {session.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {session.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
          {session.speakerName && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {session.speakerName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {session.location}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  selectedDay,
}) => {
  // Use schedule data from mock data
  const days = scheduleData;
  const [activeDay, setActiveDay] = useState(selectedDay || days[0]?.dayLabel);

  const currentDaySchedule = days.find((d) => d.dayLabel === activeDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Event Schedule</h3>
              <p className="text-indigo-100 text-sm">Plan your experience</p>
            </div>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          {days.map((day) => (
            <motion.button
              key={day.dayLabel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveDay(day.dayLabel)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeDay === day.dayLabel
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {day.dayLabel}
            </motion.button>
          ))}
        </div>

        <CardContent className="p-4">
          <AnimatePresence mode="wait">
            {currentDaySchedule && (
              <motion.div
                key={activeDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {currentDaySchedule.sessions.map((session, index) => (
                  <SessionCard key={session.id} session={session} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScheduleView;
