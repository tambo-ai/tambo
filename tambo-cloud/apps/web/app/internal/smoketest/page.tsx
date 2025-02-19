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
import {
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { z } from "zod";
import {
  ApiActivityMonitor,
  type ApiState,
} from "./components/ApiActivityMonitor";
import { wrapApiCall } from "./utils/apiWrapper";

export default function SmokePage() {
  const [input, setInput] = useState("");

  const [errors, setErrors] = useState<(TRPCClientErrorLike<any> | Error)[]>(
    [],
  );
  const { sendThreadMessage, registerComponent, generationStage, thread } =
    useHydra();
  const messages = thread?.messages ?? [];

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

  const [apiStates, setApiStates] = useState<Record<string, ApiState>>({
    aqi: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
    forecast: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
    history: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
  });

  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const wrappedApis = useWrappedApis(
    setApiStates,
    getAirQuality,
    getForecast,
    getHistoricalWeather,
  );
  const isAnyApiRunning = Object.values(apiStates).some(
    (state) => state.isRunning,
  );

  const updateApiStates = useCallback(() => {
    setApiStates({
      aqi: wrappedApis.aqi.getState(),
      forecast: wrappedApis.forecast.getState(),
      history: wrappedApis.history.getState(),
    });
  }, [wrappedApis]);
  useEffect(() => {
    if (isAnyApiRunning && !pollInterval) {
      const interval = setInterval(() => {
        console.log("polling");
        setApiStates({
          aqi: wrappedApis.aqi.getState(),
          forecast: wrappedApis.forecast.getState(),
          history: wrappedApis.history.getState(),
        });
      }, 1000);
      setPollInterval(interval);
    } else if (!isAnyApiRunning && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [apiStates, wrappedApis, pollInterval, isAnyApiRunning]);

  const tools: Record<string, HydraTool> = useMemo(
    () =>
      makeWeatherTools(
        wrappedApis.forecast.call,
        wrappedApis.history.call,
        wrappedApis.aqi.call,
      ),
    [wrappedApis],
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

  useEffect(() => {
    console.log("thread updated", thread);
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

    await generateComponent();

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
                <div key={index}>
                  {content.type === "text"
                    ? content.text
                    : `[Unhandled ${content.type}]`}
                </div>
              ))}
              {message.renderedComponent && (
                <div className="mt-2">{message.renderedComponent}</div>
              )}
            </div>
          ))}
        </div>
        <div>
          <p className="text-sm text-muted-foreground p-2">
            Generation stage: {generationStage}
          </p>
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

      <Card className="p-4">
        <h3 className="font-semibold mb-2">API Activity</h3>
        <div className="space-y-2">
          <ApiActivityMonitor
            name="Air Quality"
            state={apiStates.aqi}
            tokens={apiStates.aqi.tokens ?? undefined}
            onPauseToggle={(isPaused) => {
              if (isPaused) {
                wrappedApis.aqi.unpause();
              } else {
                wrappedApis.aqi.pause();
              }
              updateApiStates();
            }}
            onErrorToggle={(isErroring) => {
              wrappedApis.aqi.setNextError(!isErroring);
              updateApiStates();
            }}
          />
          <ApiActivityMonitor
            name="Forecast"
            state={apiStates.forecast}
            tokens={apiStates.forecast.tokens ?? undefined}
            onPauseToggle={(isPaused) => {
              if (isPaused) {
                wrappedApis.forecast.unpause();
              } else {
                wrappedApis.forecast.pause();
              }
              updateApiStates();
            }}
            onErrorToggle={(isErroring) => {
              wrappedApis.forecast.setNextError(!isErroring);
              updateApiStates();
            }}
          />
          <ApiActivityMonitor
            name="History"
            state={apiStates.history}
            tokens={apiStates.history.tokens ?? undefined}
            onPauseToggle={(isPaused) => {
              if (isPaused) {
                wrappedApis.history.unpause();
              } else {
                wrappedApis.history.pause();
              }
              updateApiStates();
            }}
            onErrorToggle={(isErroring) => {
              wrappedApis.history.setNextError(!isErroring);
              updateApiStates();
            }}
          />
        </div>
      </Card>

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

function useWrappedApis(
  setApiStates: (value: SetStateAction<Record<string, ApiState>>) => void,
  getAirQuality: (...args: any[]) => Promise<any>,
  getForecast: (...args: any[]) => Promise<any>,
  getHistoricalWeather: (...args: any[]) => Promise<any>,
) {
  return useMemo(() => {
    console.warn("Regenerating wrapped apis");
    return {
      aqi: wrapApiCall(
        getAirQuality,
        (isRunning, startTime, duration, tokens) =>
          setApiStates((prev) => ({
            ...prev,
            aqi: { ...prev.aqi, isRunning, startTime, duration, tokens },
          })),
      ),
      forecast: wrapApiCall(
        getForecast,
        (isRunning, startTime, duration, tokens) =>
          setApiStates((prev) => ({
            ...prev,
            forecast: {
              ...prev.forecast,
              isRunning,
              startTime,
              duration,
              tokens,
            },
          })),
      ),
      history: wrapApiCall(
        getHistoricalWeather,
        (isRunning, startTime, duration, tokens) =>
          setApiStates((prev) => ({
            ...prev,
            history: {
              ...prev.history,
              isRunning,
              startTime,
              duration,
              tokens,
            },
          })),
      ),
    };
  }, [getAirQuality, getForecast, getHistoricalWeather, setApiStates]);
}

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
