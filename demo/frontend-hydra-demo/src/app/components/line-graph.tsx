import { useMemo } from "react";
import { AxisOptions, Chart } from "react-charts";
import { LineGraphProps } from "./types";
import { z } from "zod";

export default function LineGraph(props: z.infer<typeof LineGraphProps>) {
  const primaryAxis = useMemo(
    (): AxisOptions<(typeof props.series)[0]["data"][0]> => ({
      getValue: (datum) => new Date(datum.timestamp),
    }),
    [props.series]
  );

  const secondaryAxes = useMemo(
    (): AxisOptions<(typeof props.series)[0]["data"][0]>[] => [
      {
        getValue: (datum) => Number(datum.value),
      },
    ],
    [props.series]
  );

  console.log(props);

  return (
    <div className={`h-[300px] w-full ${props.backgroundColor} rounded-md`}>
      <h1 className={props.titleClassName}>{props.title}</h1>
      <p className={props.descriptionClassName}>{props.description}</p>
      <Chart
        options={{
          data: props.series.map((series: any) => ({
            ...series,
            data: series.data.map((dataPoint: any) => ({
              ...dataPoint,
              value: Number(dataPoint.value),
            })),
          })),
          primaryAxis,
          secondaryAxes,
        }}
      />
    </div>
  );
}
