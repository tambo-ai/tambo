"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";
import { api } from "@/trpc/react";
import { ComponentContextTool } from "@tambo-ai-cloud/backend";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientErrorLike } from "@trpc/client";
// Using the existing HydraClient but importing it from the original package
import { HydraClient } from "hydra-ai";
import { X } from "lucide-react";
import { ReactElement, useMemo, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: (string | ReactElement)[];
  suggestedActions?: Array<{
    label: string;
    actionText: string;
  }>;
}

export default function SmokePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);

  const [errors, setErrors] = useState<(TRPCClientErrorLike<any> | Error)[]>(
    [],
  );

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
  const { mutateAsync: getCurrentWeather, isPending: isCurrentWeatherPending } =
    api.demo.currentWeather.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });
  const hydraClient = useWeatherHydra({
    getForecast,
    getCurrentWeather,
    getHistoricalWeather,
    getAirQuality,
  });

  const { mutateAsync: generateComponent, isPending: isGenerating } =
    useMutation({
      mutationFn: async () => {
        try {
          const response = await hydraClient.generateComponent(
            input,
            (msg) => {
              console.log(msg);
            },
            threadId ?? undefined,
          );
          setThreadId(response.threadId ?? null);
          return response;
        } catch (error) {
          setErrors((prev) => [...prev, error as Error]);
          throw error;
        }
      },
    });

  const isLoading =
    isAqiPending ||
    isForecastPending ||
    isHistoryPending ||
    isCurrentWeatherPending ||
    isGenerating;

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
      suggestedActions: response.suggestedActions,
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

        {messages.length > 0 && (
          <div className="mt-4">
            {messages[messages.length - 1]?.suggestedActions?.length ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Suggested actions:
                </div>
                <div className="flex flex-wrap gap-2">
                  {messages[messages.length - 1].suggestedActions?.map(
                    (action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (action.actionText) {
                            setInput(action.actionText);
                          }
                        }}
                      >
                        {action.label}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No suggested actions available
              </div>
            )}
          </div>
        )}
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

const WeatherDay = ({ data }: WeatherDayProps): React.ReactNode => {
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

const AirQuality = ({ data }: AirQualityProps): React.ReactNode => {
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

function useWeatherHydra({
  getForecast,
  getCurrentWeather,
  getHistoricalWeather,
  getAirQuality,
}: {
  getForecast: (...args: any[]) => Promise<any>;
  getCurrentWeather: (...args: any[]) => Promise<any>;
  getHistoricalWeather: (...args: any[]) => Promise<any>;
  getAirQuality: (...args: any[]) => Promise<any>;
}) {
  return useMemo(() => {
    const client = new HydraClient({
      hydraApiKey: env.NEXT_PUBLIC_TAMBO_API_KEY,
      hydraApiUrl: env.NEXT_PUBLIC_TAMBO_API_URL,
    });
    const tools: Record<string, ComponentContextTool> = {
      forecast: {
        definition: {
          name: "getWeatherForecast",
          description: "Get the weather forecast",
          parameters: [
            {
              name: "params",
              type: "object",
              description:
                "The parameters to get the weather forecast for, as an object with just one key, 'location', e.g. '{location: \"New York\"}'",
              isRequired: true,
              schema: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
              },
            },
          ],
        },
        getComponentContext: getForecast,
      },
      currentWeather: {
        definition: {
          name: "getCurrentWeather",
          description: "Get the current weather",
          parameters: [
            {
              name: "params",
              type: "object",
              description:
                "The parameters to get the weather forecast for, as an object with just one key, 'location', e.g. '{location: \"New York\"}'",
              isRequired: true,
              schema: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
              },
            },
          ],
        },
        getComponentContext: getCurrentWeather,
      },
      history: {
        definition: {
          name: "getHistoricalWeather",
          description: "Get the historical weather",
          parameters: [
            {
              name: "params",
              type: "object",
              description: `The parameters to get the historical weather for, as an object with two keys, 
                'location' and 'datetime', e.g. '{location: "New York", datetime: "2024-01-01"}'`,
              isRequired: true,
              schema: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  datetime: { type: "string" },
                },
              },
            },
          ],
        },
        getComponentContext: getHistoricalWeather,
      },
      aqi: {
        definition: {
          name: "getAirQuality",
          description: "Get the air quality",
          parameters: [
            {
              name: "params",
              type: "object",
              description: `The parameters to get the air quality for, as an object with just one key, 'location', e.g. '{location: "New York"}'`,
              isRequired: true,
              schema: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
              },
            },
          ],
        },
        getComponentContext: getAirQuality,
      },
    };
    registerComponents(client, tools);
    return client;
  }, [getAirQuality, getCurrentWeather, getForecast, getHistoricalWeather]);
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
