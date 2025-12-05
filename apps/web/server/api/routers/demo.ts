// apps/web/server/api/routers/demo.ts
import { env } from "@/lib/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod/v3";

export const demoRouter = createTRPCRouter({
  aqi: protectedProcedure
    .input(
      z.object({
        location: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Implement the logic to fetch AQI data for the given location
      return await getAirQuality(input.location);
    }),
  currentWeather: protectedProcedure
    .input(
      z.object({
        location: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const forecast = await getForecast(input.location);
      return {
        location: forecast.location,
        current: forecast.current,
      };
    }),

  forecast: protectedProcedure
    .input(
      z.object({
        location: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Implement the logic to fetch weather forecast for the given location
      const forecast = await getForecast(input.location);
      return {
        location: forecast.location,
        forecast: forecast.forecast,
      };
    }),

  history: protectedProcedure
    .input(
      z.object({
        location: z.string(),
        datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid datetime format",
        }),
      }),
    )
    .mutation(async ({ input }) => {
      // Implement the logic to fetch historical weather data for the given location and datetime
      return await getHistoricalWeather(input.location, input.datetime);
    }),
});

// Too bad this api doesn't have a decent SDK
// Helper function to make API calls with shared configuration
async function callWeatherApi(
  endpoint: string,
  params: Record<string, string>,
) {
  const baseUrl = "http://api.weatherapi.com/v1";
  const apiKey = env.WEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("WEATHER_API_KEY environment variable is not set");
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    ...params,
  });

  const response = await fetch(`${baseUrl}${endpoint}?${queryParams}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  return await response.json();
}
// Response types based on WeatherAPI.com OpenAPI spec
export interface AirQualityResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    air_quality: {
      co: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      "us-epa-index": number;
      "gb-defra-index": number;
    };
  };
}

export interface ForecastResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
  };
  forecast: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
      };
    }>;
  };
}

export interface HistoryResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        temp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
      }>;
    }>;
  };
}

// Get air quality data for a location
async function getAirQuality(location: string): Promise<AirQualityResponse> {
  return await callWeatherApi("/current.json", {
    q: location,
    aqi: "yes",
  });
}

// Get weather forecast for a location
async function getForecast(location: string): Promise<ForecastResponse> {
  return await callWeatherApi("/forecast.json", {
    q: location,
    days: "3", // Default to 3 day forecast
  });
}

// Get historical weather data
async function getHistoricalWeather(
  location: string,
  date: string,
): Promise<HistoryResponse> {
  return await callWeatherApi("/history.json", {
    q: location,
    dt: date,
  });
}
