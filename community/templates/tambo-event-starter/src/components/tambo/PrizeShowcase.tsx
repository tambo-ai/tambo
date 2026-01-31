"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Gift, Star, Award } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { PrizeShowcaseProps, Prize } from "@/types";
import { prizesData } from "@/lib/mock-data";

const categoryIcons: Record<string, React.ReactNode> = {
  Overall: <Trophy className="w-6 h-6" />,
  Technical: <Star className="w-6 h-6" />,
  Impact: <Gift className="w-6 h-6" />,
  Design: <Award className="w-6 h-6" />,
  Community: <Gift className="w-6 h-6" />,
  Special: <Star className="w-6 h-6" />,
};

const categoryColors: Record<string, string> = {
  Overall: "from-yellow-400 to-amber-500",
  Technical: "from-blue-400 to-indigo-500",
  Impact: "from-green-400 to-emerald-500",
  Design: "from-pink-400 to-rose-500",
  Community: "from-purple-400 to-violet-500",
  Special: "from-cyan-400 to-teal-500",
};

const PrizeCard: React.FC<{ prize: Prize; index: number }> = ({ prize, index }) => {
  const colorClass = categoryColors[prize.category] || "from-gray-400 to-gray-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group"
    >
      <Card className="overflow-hidden h-full">
        <div className={`bg-gradient-to-br ${colorClass} p-4`}>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
              {prize.icon ? (
                <span className="text-2xl">{prize.icon}</span>
              ) : (
                categoryIcons[prize.category] || <Trophy className="w-6 h-6" />
              )}
            </div>
            <Badge variant="default" className="bg-white/20 text-white border-0">
              {prize.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {prize.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {prize.description}
          </p>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {prize.value}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const PrizeShowcase: React.FC<PrizeShowcaseProps> = ({
  category,
}) => {
  // Use mock data directly
  const prizes = prizesData;

  const filteredPrizes = category
    ? prizes.filter((p: Prize) => p.category.toLowerCase() === category.toLowerCase())
    : prizes;

  // Sort to show grand prize first
  const sortedPrizes = [...filteredPrizes].sort((a, b) => {
    if (a.category === "Overall") return -1;
    if (b.category === "Overall") return 1;
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Prizes & Rewards</h3>
              <p className="text-yellow-100 text-sm">
                Over $50,000 in total prizes!
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {sortedPrizes.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No prizes found{category && ` for "${category}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPrizes.map((prize, index) => (
                <PrizeCard key={prize.id} prize={prize} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PrizeShowcase;
