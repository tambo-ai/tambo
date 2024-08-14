import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Sun, Cloud, CloudSun, Send } from "lucide-react";

const WeatherExample = () => {
  const forecast = [
    { day: "Mon", temp: "72°", condition: "Sunny", icon: Sun },
    { day: "Tue", temp: "68°", condition: "Partly Cloudy", icon: CloudSun },
    { day: "Wed", temp: "65°", condition: "Cloudy", icon: Cloud },
    { day: "Thu", temp: "70°", condition: "Sunny", icon: Sun },
    { day: "Fri", temp: "75°", condition: "Clear", icon: Sun },
  ];

  return (
    <Card className="w-full max-w-sm mx-auto mt-8 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Forecast</h2>
        <div className="space-y-4">
          {forecast.map((day, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">
                {day.day}
              </span>
              <day.icon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">
                {day.temp}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4">
        <div className="flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
          <input
            type="text"
            placeholder="Enter instruction..."
            className="flex-grow bg-transparent outline-none text-sm text-gray-700 placeholder-gray-500"
          />
          <button className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WeatherExample;
