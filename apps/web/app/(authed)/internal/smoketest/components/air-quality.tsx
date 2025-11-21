import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTamboComponentState } from "@tambo-ai/react";
import { ReactNode } from "react";

interface AirQualityProps {
  aqi?: number;
  pm2_5?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
}

export const AirQuality = (data: AirQualityProps): ReactNode => {
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
