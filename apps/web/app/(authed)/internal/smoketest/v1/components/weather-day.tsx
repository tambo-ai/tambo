import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTamboComponentState } from "@tambo-ai/react";
import { ReactNode } from "react";

interface WeatherDayInfo {
  date?: string;
  day?: {
    maxtemp_c?: number;
    mintemp_c?: number;
    avgtemp_c?: number;
    maxwind_kph?: number;
    totalprecip_mm?: number;
    avghumidity?: number;
    condition?: {
      text?: string;
      icon?: string;
    };
  };
}

interface WeatherDayProps {
  readonly data?: WeatherDayInfo;
}

// Helper functions for unit conversion
const celsiusToFahrenheit = (celsius: number): number =>
  Math.round((celsius * 9) / 5 + 32);
const kmhToMph = (kmh: number): number => Math.round(kmh * 0.621371);
const mmToInches = (mm: number): number => Number((mm * 0.0393701).toFixed(2));

export const WeatherDay = ({ data }: WeatherDayProps): ReactNode => {
  const [imperialUnits, setUseImperialUnits] = useTamboComponentState(
    "imperialUnits",
    false,
  );

  if (!data) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Loading weather data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Select
          value={imperialUnits ? "imperial" : "metric"}
          onValueChange={(value) => setUseImperialUnits(value === "imperial")}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric</SelectItem>
            <SelectItem value="imperial">Imperial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {data.date ? new Date(data.date).toLocaleDateString() : ""}
          </p>
          <div className="flex items-center gap-2">
            {data.day?.condition?.icon &&
              // Check if the icon URL is protocol-relative (starts with '//')
              // If so, use a regular img tag instead of Next.js Image component
              (data.day.condition.icon.startsWith("//") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.day.condition.icon}
                  alt={data.day.condition.text ?? "Weather condition"}
                  width={64}
                  height={64}
                  style={{ width: "64px", height: "64px" }}
                />
              ) : (
                <Image
                  src={data.day.condition.icon}
                  alt={data.day.condition.text ?? "Weather condition"}
                  width={64}
                  height={64}
                  quality={85}
                />
              ))}
            <p className="text-sm text-muted-foreground">
              {data.day?.condition?.text ?? ""}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">
            {data.day?.avgtemp_c !== undefined
              ? imperialUnits
                ? celsiusToFahrenheit(data.day.avgtemp_c) + "°F"
                : Math.round(data.day.avgtemp_c) + "°C"
              : "--°"}
          </div>
          <div className="text-sm text-muted-foreground">
            H:{" "}
            {data.day?.maxtemp_c !== undefined
              ? `${
                  imperialUnits
                    ? celsiusToFahrenheit(data.day.maxtemp_c)
                    : Math.round(data.day.maxtemp_c)
                }°`
              : "--°"}{" "}
            L:{" "}
            {data.day?.mintemp_c !== undefined
              ? `${
                  imperialUnits
                    ? celsiusToFahrenheit(data.day.mintemp_c)
                    : Math.round(data.day.mintemp_c)
                }°`
              : "--°"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Wind</p>
          <p>
            {data.day?.maxwind_kph !== undefined
              ? imperialUnits
                ? kmhToMph(data.day.maxwind_kph) + " mph"
                : Math.round(data.day.maxwind_kph) + " km/h"
              : "--"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Precipitation</p>
          <p>
            {data.day?.totalprecip_mm !== undefined
              ? imperialUnits
                ? mmToInches(data.day.totalprecip_mm) + " in"
                : data.day.totalprecip_mm + " mm"
              : "--"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Humidity</p>
          <p>
            {data.day?.avghumidity !== undefined
              ? `${Math.round(data.day.avghumidity)}%`
              : "--"}
          </p>
        </div>
      </div>
    </Card>
  );
};
