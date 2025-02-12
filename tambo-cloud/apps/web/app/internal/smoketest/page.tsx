"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { useHydra } from "@hydra-ai/react";
import { HydraTool } from "@hydra-ai/react/dist/model/component-metadata";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientErrorLike } from "@trpc/client";
import { ComponentContextTool } from "@use-hydra-ai/hydra-ai-server";
import { HydraClient } from "hydra-ai";
import { X } from "lucide-react";
import { ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import { z } from "zod";

interface Message {
  role: "user" | "assistant";
  content: (string | ReactElement)[];
}

export default function SmokePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [errors, setErrors] = useState<(TRPCClientErrorLike<any> | Error)[]>(
    [],
  );
  const { sendThreadMessage, registerComponent, generationStage, thread } =
    useHydra();

  const { mutateAsync: getAirQuality, isPending: isAqiPending } =
    api.demo.aqi.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });
  const { mutateAsync: getForecast, isPending: isForecastPending } =
    api.demo.forecast.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });
  const { mutateAsync: getHistoricalWeather, isPending: isHistoryPending } =
    api.demo.history.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });

  const tools: Record<string, HydraTool> = useMemo(
    () => makeWeatherTools(getForecast, getHistoricalWeather, getAirQuality),
    [getForecast, getHistoricalWeather, getAirQuality],
  );

  useEffect(() => {
    console.log("registering components");
    registerComponent({
      component: WeatherDay,
      name: "WeatherDay",
      description: "A weather day",
      propsDefinition: {
        data: "{ date: string; day: { maxtemp_c: number; mintemp_c: number; avgtemp_c: number; maxwind_kph: number; totalprecip_mm: number; avghumidity: number; condition: { text: string; icon: string } } }",
      },
      associatedTools: [tools.forecast, tools.history],
    });
    registerComponent({
      component: AirQuality,
      name: "AirQuality",
      description: "Air quality",
      propsDefinition: {
        data: "{ aqi: number; pm2_5: number; pm10: number; o3: number; no2: number }",
      },
      associatedTools: [tools.aqi],
    });
  }, [registerComponent, tools]);

  // const hydraClient = useWeatherHydra({
  //   getForecast,
  //   getHistoricalWeather,
  //   getAirQuality,
  // });
  useEffect(() => {
    console.log("thread update", thread);
  }, [thread]);

  const { mutateAsync: generateComponent, isPending: isGenerating } =
    useMutation({
      mutationFn: async () => {
        try {
          console.log("generating component with input", input);
          const response = await sendThreadMessage(input, thread.id);
          return response;
        } catch (error) {
          setErrors((prev) => [...prev, error as Error]);
          throw error;
        }
      },
    });

  const isLoading =
    isAqiPending || isForecastPending || isHistoryPending || isGenerating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const response = await generateComponent();

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: [input],
    };

    // Add assistant response
    const assistantMessage: Message = {
      role: "assistant",
      content: [response.message],
    };
    if (response?.component) {
      assistantMessage.content.push(response.component);
    }
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div className="container max-w-2xl py-8 space-y-4">
      <Card className="p-4 min-h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-12"
                  : "bg-muted mr-12"
              }`}
            >
              {message.content.map((content, index) => (
                <div key={index}>{content}</div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <p>Generation stage: {generationStage}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-block animate-spin">⟳</span>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </Card>

      {errors.length > 0 && (
        <Card className="p-4 bg-destructive/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Errors</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrors([])}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="text-sm font-mono">
                {error.message || String(error)}
              </div>
            ))}
          </div>
        </Card>
      )}
      <div>
        <p>Thread ID: &apos;{thread.id}&apos;</p>
      </div>
    </div>
  );
}

interface WeatherDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    avghumidity: number;
    condition: {
      text: string;
      icon: string;
    };
  };
}

interface WeatherDayProps {
  readonly data: WeatherDay;
}

const WeatherDay = ({ data }: WeatherDayProps): ReactNode => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {new Date(data.date).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            <img
              src={data.day.condition.icon}
              alt={data.day.condition.text}
              width={64}
              height={64}
            />
            <p className="text-sm text-muted-foreground">
              {data.day.condition.text}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">
            {Math.round(data.day.avgtemp_c)}°C
          </div>
          <div className="text-sm text-muted-foreground">
            H: {Math.round(data.day.maxtemp_c)}° L:{" "}
            {Math.round(data.day.mintemp_c)}°
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Wind</p>
          <p>{Math.round(data.day.maxwind_kph)} km/h</p>
        </div>
        <div>
          <p className="text-muted-foreground">Precipitation</p>
          <p>{data.day.totalprecip_mm} mm</p>
        </div>
        <div>
          <p className="text-muted-foreground">Humidity</p>
          <p>{Math.round(data.day.avghumidity)}%</p>
        </div>
      </div>
    </Card>
  );
};

interface AirQualityProps {
  readonly data: {
    aqi: number;
    pm2_5: number;
    pm10: number;
    o3: number;
    no2: number;
  };
}

const AirQuality = ({ data }: AirQualityProps): ReactNode => {
  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Air Quality</p>
          <p className="text-sm text-muted-foreground">
            {getAqiLevel(data.aqi)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{data.aqi}</div>
          <div className="text-sm text-muted-foreground">AQI</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">PM2.5</p>
          <p>{data.pm2_5} µg/m³</p>
        </div>
        <div>
          <p className="text-muted-foreground">PM10</p>
          <p>{data.pm10} µg/m³</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ozone</p>
          <p>{data.o3} ppb</p>
        </div>
        <div>
          <p className="text-muted-foreground">Nitrogen Dioxide</p>
          <p>{data.no2} ppb</p>
        </div>
      </div>
    </Card>
  );
};

function makeWeatherTools(
  getForecast: (...args: any[]) => Promise<any>,
  getHistoricalWeather: (...args: any[]) => Promise<any>,
  getAirQuality: (...args: any[]) => Promise<any>,
): Record<string, HydraTool> {
  return {
    forecast: {
      name: "getWeatherForecast",
      description: "Get the weather forecast",
      tool: getForecast,
      toolSchema: z.function().args(
        z
          .object({
            location: z
              .string()
              .describe("The location to get the weather forecast for"),
          })
          .describe("The parameters to get the weather forecast for"),
      ),
    },
    history: {
      name: "getHistoricalWeather",
      description: "Get the historical weather",
      tool: getHistoricalWeather,
      toolSchema: z
        .function()
        .args(
          z
            .object({
              location: z
                .string()
                .describe("The location to get the historical weather for"),
              datetime: z
                .string()
                .describe("The datetime to get the historical weather for"),
            })
            .describe("The parameters to get the historical weather for"),
        )
        .returns(z.any()),
    },
    aqi: {
      name: "getAirQuality",
      description: "Get the air quality",
      tool: getAirQuality,
      toolSchema: z.function().args(
        z
          .object({
            location: z
              .string()
              .describe("The location to get the air quality for"),
          })
          .describe("The parameters to get the air quality for"),
      ),
    },
  };
}

function registerComponents(
  client: HydraClient,
  tools: Record<string, ComponentContextTool>,
) {
  client.registerComponent({
    component: WeatherDay,
    name: "WeatherDay",
    description: "A weather day",
    propsDefinition: {
      data: "{ date: string; day: { maxtemp_c: number; mintemp_c: number; avgtemp_c: number; maxwind_kph: number; totalprecip_mm: number; avghumidity: number; condition: { text: string; icon: string } } }",
    },
    contextTools: [tools.forecast, tools.history],
  });
  client.registerComponent({
    component: AirQuality,
    name: "AirQuality",
    description: "Air quality",
    propsDefinition: {
      data: "{ aqi: number; pm2_5: number; pm10: number; o3: number; no2: number }",
    },
    contextTools: [tools.aqi],
  });
}
