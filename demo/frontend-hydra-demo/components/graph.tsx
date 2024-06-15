"use client";

import { z } from "zod";
import { TimeSeriesDataProps } from "./types";

export const TimeSeriesData = (props: z.infer<typeof TimeSeriesDataProps>) => {
  return (
    <div>
      <h1 className={props.titleClassName}>{props.title}</h1>
      <p className={props.descriptionClassName}>{props.description}</p>
      <ul className={props.dataClassName}>
        {props.data.map((dataPoint, index) => (
          <li key={index}>
            <span>{dataPoint.timestamp}: </span>
            <span>{dataPoint.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
