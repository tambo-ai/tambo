"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { SponsorsGridProps, SponsorTier, Sponsor } from "@/types";
import { sponsorsData } from "@/lib/mock-data";

const tierConfig: Record<SponsorTier, { label: string; color: string; size: string }> = {
  platinum: { label: "Platinum", color: "bg-gradient-to-br from-gray-300 to-gray-400", size: "col-span-2 row-span-2" },
  gold: { label: "Gold", color: "bg-gradient-to-br from-yellow-300 to-amber-400", size: "col-span-2" },
  silver: { label: "Silver", color: "bg-gradient-to-br from-gray-200 to-gray-300", size: "" },
  bronze: { label: "Bronze", color: "bg-gradient-to-br from-orange-300 to-orange-400", size: "" },
  community: { label: "Community", color: "bg-gradient-to-br from-indigo-200 to-purple-300", size: "" },
};

export const SponsorsGrid: React.FC<SponsorsGridProps> = ({
  tier,
}) => {
  // Use mock data directly
  const sponsors = sponsorsData;

  const filteredSponsors = tier
    ? sponsors.filter((s: Sponsor) => s.tier === tier)
    : sponsors;

  // Group sponsors by tier
  const groupedSponsors = filteredSponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<SponsorTier, typeof sponsors>);

  const tierOrder: SponsorTier[] = ["platinum", "gold", "silver", "bronze", "community"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Our Sponsors</h3>
              <p className="text-slate-300 text-sm">
                Thank you to our amazing partners
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {filteredSponsors.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No sponsors found{tier && ` for "${tier}" tier`}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {tierOrder.map((tierKey) => {
                const tieredSponsors = groupedSponsors[tierKey];
                if (!tieredSponsors || tieredSponsors.length === 0) return null;

                return (
                  <div key={tierKey}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-4 h-4 rounded-full ${tierConfig[tierKey].color}`} />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {tierConfig[tierKey].label} Sponsors
                      </h4>
                    </div>

                    <div className={`grid gap-4 ${
                      tierKey === "platinum" 
                        ? "grid-cols-1 md:grid-cols-2" 
                        : tierKey === "gold" 
                        ? "grid-cols-2 md:grid-cols-3" 
                        : "grid-cols-2 md:grid-cols-4"
                    }`}>
                      {tieredSponsors.map((sponsor, index) => (
                        <motion.a
                          key={sponsor.id}
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`group relative p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition-all ${
                            tierKey === "platinum" ? "py-8" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className={`mb-3 ${
                              tierKey === "platinum" ? "h-16" : "h-10"
                            } flex items-center justify-center`}>
                              <img
                                src={sponsor.logo}
                                alt={sponsor.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <span className={`font-medium text-gray-900 dark:text-white ${
                              tierKey === "platinum" ? "text-lg" : "text-sm"
                            }`}>
                              {sponsor.name}
                            </span>
                            {sponsor.description && tierKey === "platinum" && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {sponsor.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="absolute top-3 right-3 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SponsorsGrid;
