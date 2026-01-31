"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui";
import { CountdownTimerProps } from "@/types";
import { getTimeUntil } from "@/lib/utils";
import { eventData } from "@/lib/mock-data";

export const CountdownTimer: React.FC<CountdownTimerProps> = (props) => {
  // Use props if provided, otherwise fall back to event data
  const targetDate = props.targetDate || eventData.dates.start;
  const label = props.label || `Countdown to ${eventData.name}`;

  const [timeLeft, setTimeLeft] = useState(getTimeUntil(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntil(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  if (timeLeft.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Event Has Started! 🎉</h3>
          </div>
          <p className="text-green-100">Join us now!</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="relative p-8">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-indigo-400" />
              <span className="text-lg text-gray-300">{label}</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {timeUnits.map((unit, index) => (
                <motion.div
                  key={unit.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-2">
                    <motion.span
                      key={unit.value}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent"
                    >
                      {String(unit.value).padStart(2, "0")}
                    </motion.span>
                  </div>
                  <span className="text-sm text-gray-400 uppercase tracking-wider">
                    {unit.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default CountdownTimer;
