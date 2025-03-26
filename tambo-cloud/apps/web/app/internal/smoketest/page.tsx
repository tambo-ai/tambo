"use client";

import { ThreadList } from "@/components/thread/thread-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/hooks/auth";
import { api } from "@/trpc/react";
import {
  TamboTool,
  useTambo,
  useTamboComponentState,
  useTamboThreadList,
} from "@tambo-ai/react";
import { TRPCClientErrorLike } from "@trpc/client";
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
import { MessageSuggestions } from "./components/MessageSuggestions";
import { ThreadMessageInput } from "./components/ThreadMessageInput";
import { wrapApiCall } from "./utils/apiWrapper";

export default function SmokePage() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [errors, setErrors] = useState<(TRPCClientErrorLike<any> | Error)[]>(
    [],
  );
  const { registerComponent, generationStage, thread, switchCurrentThread } =
    useTambo();
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

  const tools: Record<string, TamboTool> = useMemo(
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

  const { data: threadInfo, isLoading: isThreadInfoLoading } =
    useTamboThreadList({
      contextKey: userId,
    });

  const isLoading =
    isAqiPending ||
    isForecastPending ||
    isHistoryPending ||
    isThreadInfoLoading;

  return (
    <div className="container max-w-4xl py-8 space-y-4">
      <div className="flex  gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Threads</h2>
          </div>
          <ThreadList
            threads={threadInfo?.items ?? []}
            selectedThreadId={thread?.id}
            onThreadSelect={(threadId) => {
              switchCurrentThread(threadId);
            }}
            isLoading={isLoading}
          />
        </Card>
        <div className="flex-1">
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
            <MessageSuggestions maxSuggestions={3} />
            <div>
              <p className="text-sm text-muted-foreground p-2">
                Generation stage: {generationStage}
              </p>
            </div>
            <ThreadMessageInput contextKey={userId} />
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
            <p>Thread ID: &apos;{thread?.id}&apos;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WeatherDay {
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
  readonly data?: WeatherDay;
}

const WeatherDay = ({ data }: WeatherDayProps): ReactNode => {
  if (!data) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Loading weather data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {data.date ? new Date(data.date).toLocaleDateString() : ""}
          </p>
          <div className="flex items-center gap-2">
            {data.day?.condition?.icon && (
              <img
                src={data.day.condition.icon}
                alt={data.day.condition?.text ?? "Weather condition"}
                width={64}
                height={64}
              />
            )}
            <p className="text-sm text-muted-foreground">
              {data.day?.condition?.text ?? ""}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">
            {data.day?.avgtemp_c !== undefined
              ? `${Math.round(data.day.avgtemp_c)}°C`
              : "--°C"}
          </div>
          <div className="text-sm text-muted-foreground">
            H:{" "}
            {data.day?.maxtemp_c !== undefined
              ? `${Math.round(data.day.maxtemp_c)}°`
              : "--°"}{" "}
            L:{" "}
            {data.day?.mintemp_c !== undefined
              ? `${Math.round(data.day.mintemp_c)}°`
              : "--°"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Wind</p>
          <p>
            {data.day?.maxwind_kph !== undefined
              ? `${Math.round(data.day.maxwind_kph)} km/h`
              : "--"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Precipitation</p>
          <p>
            {data.day?.totalprecip_mm !== undefined
              ? `${data.day.totalprecip_mm} mm`
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

interface AirQualityProps {
  readonly data?: {
    aqi?: number;
    pm2_5?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
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

  const [checked1, setChecked1] = useTamboComponentState("checked1", false);
  const [checked2, setChecked2] = useTamboComponentState("checked2", false);
  const [checked3, setChecked3] = useState(false);

  if (!data) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Loading air quality data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <div>State Demo: </div>
        <Checkbox
          id="checked1"
          checked={checked1}
          onCheckedChange={(c: boolean) => setChecked1(c)}
        />
        <label htmlFor="checked1">One</label>
        <Checkbox
          id="checked2"
          checked={checked2}
          onCheckedChange={(c: boolean) => setChecked2(c)}
        />
        <label htmlFor="checked2">Two</label>
        <Checkbox
          id="checked3"
          checked={checked3}
          onCheckedChange={(c: boolean) => setChecked3(c)}
        />
        <label htmlFor="checked3">Three (not in Tambo)</label>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Air Quality</p>
          <p className="text-sm text-muted-foreground">
            {data.aqi !== undefined ? getAqiLevel(data.aqi) : "--"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{data.aqi ?? "--"}</div>
          <div className="text-sm text-muted-foreground">AQI</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">PM2.5</p>
          <p>{data.pm2_5 !== undefined ? `${data.pm2_5} µg/m³` : "--"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">PM10</p>
          <p>{data.pm10 !== undefined ? `${data.pm10} µg/m³` : "--"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ozone</p>
          <p>{data.o3 !== undefined ? `${data.o3} ppb` : "--"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Nitrogen Dioxide</p>
          <p>{data.no2 !== undefined ? `${data.no2} ppb` : "--"}</p>
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
  const updateAqiState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        aqi: { ...prev.aqi, isRunning, startTime, duration, tokens },
      })),
    [setApiStates],
  );

  const updateForecastState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        forecast: { ...prev.forecast, isRunning, startTime, duration, tokens },
      })),
    [setApiStates],
  );

  const updateHistoryState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        history: { ...prev.history, isRunning, startTime, duration, tokens },
      })),
    [setApiStates],
  );

  return useMemo(
    () => ({
      aqi: wrapApiCall(getAirQuality, updateAqiState),
      forecast: wrapApiCall(getForecast, updateForecastState),
      history: wrapApiCall(getHistoricalWeather, updateHistoryState),
    }),
    [
      getAirQuality,
      getForecast,
      getHistoricalWeather,
      updateAqiState,
      updateForecastState,
      updateHistoryState,
    ],
  );
}

function makeWeatherTools(
  getForecast: (...args: any[]) => Promise<any>,
  getHistoricalWeather: (...args: any[]) => Promise<any>,
  getAirQuality: (...args: any[]) => Promise<any>,
): Record<string, TamboTool> {
  const forecastSchema = z
    .object({
      location: z
        .string()
        .describe("The location to get the weather forecast for"),
    })
    .describe("The parameters to get the weather forecast for");

  const historySchema = z
    .object({
      location: z
        .string()
        .describe("The location to get the historical weather for"),
      datetime: z
        .string()
        .describe("The datetime to get the historical weather for"),
    })
    .describe("The parameters to get the historical weather for");

  const aqiSchema = z
    .object({
      location: z.string().describe("The location to get the air quality for"),
    })
    .describe("The parameters to get the air quality for");

  return {
    forecast: {
      name: "getWeatherForecast",
      description: "Get the weather forecast",
      tool: getForecast,
      toolSchema: z.function().args(forecastSchema).returns(z.any()),
    },
    history: {
      name: "getHistoricalWeather",
      description: "Get the historical weather",
      tool: getHistoricalWeather,
      toolSchema: z.function().args(historySchema).returns(z.any()),
    },
    aqi: {
      name: "getAirQuality",
      description: "Get the air quality",
      tool: getAirQuality,
      toolSchema: z.function().args(aqiSchema).returns(z.any()),
    },
  };
}
