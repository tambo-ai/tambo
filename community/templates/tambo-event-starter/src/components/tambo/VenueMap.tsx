"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Car, Train, Wifi, Coffee, Utensils, BatteryCharging } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { VenueMapProps } from "@/types";
import { eventData } from "@/lib/mock-data";

const facilityIcons: Record<string, React.ReactNode> = {
  "Free WiFi": <Wifi className="w-4 h-4" />,
  "24/7 Access": <BatteryCharging className="w-4 h-4" />,
  "Sleeping Pods": <Coffee className="w-4 h-4" />,
  "Snack Bar": <Utensils className="w-4 h-4" />,
  "Charging Stations": <BatteryCharging className="w-4 h-4" />,
  "Meditation Room": <Coffee className="w-4 h-4" />,
};

export const VenueMap: React.FC<VenueMapProps> = ({
  showDirections = true,
}) => {
  // Use venue data from mock data
  const venue = eventData.venue;

  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(
    `${venue.address}, ${venue.city}, ${venue.country}`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Venue & Location</h3>
              <p className="text-teal-100 text-sm">Find your way to the event</p>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Map Placeholder */}
          <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">{venue.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{venue.city}, {venue.country}</p>
              </div>
            </div>
            {/* Decorative map grid */}
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full" style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }} />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Address */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                Address
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {venue.name}<br />
                {venue.address}<br />
                {venue.city}, {venue.country}
              </p>
            </div>

            {/* Directions */}
            {showDirections && venue.directions && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-indigo-500" />
                  Getting There
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {venue.directions}
                </p>
              </div>
            )}

            {/* Transportation Options */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Train className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">5 min from BART</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Car className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Parking $15/day</span>
              </div>
            </div>

            {/* Facilities */}
            {venue.facilities && venue.facilities.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Venue Facilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {venue.facilities.map((facility) => (
                    <div
                      key={facility}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                    >
                      {facilityIcons[facility] || <Coffee className="w-4 h-4" />}
                      {facility}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {venue.mapUrl && (
                <Button
                  variant="primary"
                  onClick={() => window.open(venue.mapUrl, "_blank")}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Google Maps
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VenueMap;
