import { useMemo } from "react";
import { AxisOptions, Chart } from "react-charts";

type DailyStars = {
  date: Date;
  stars: number;
};

type Series = {
  label: string;
  data: DailyStars[];
};

function generateDataSeries(
  label: string,
  startStars: number,
  startDate: Date,
  days: number
): Series {
  const data: DailyStars[] = [];
  let currentStars = startStars;

  for (let i = 0; i < days; i++) {
    currentStars += Math.floor(Math.random() * 100); // Increment stars by a random amount between 0 and 100
    data.push({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000), // Increment date by one day
      stars: currentStars,
    });
  }

  console.log(data);

  return { label, data };
}

const data: Series[] = [
  generateDataSeries("SeriesA", 20, new Date(2024, 0, 1), 10),
  generateDataSeries("SeriesB", 102, new Date(2024, 0, 1), 10),
];

export default function LineGraph() {
  const primaryAxis = useMemo(
    (): AxisOptions<DailyStars> => ({
      getValue: (datum) => datum.date,
    }),
    []
  );

  const secondaryAxes = useMemo(
    (): AxisOptions<DailyStars>[] => [
      {
        getValue: (datum) => datum.stars,
      },
    ],
    []
  );

  return (
    <div className="h-[300px] w-full bg-white rounded-md">
      <Chart
        options={{
          data,
          primaryAxis,
          secondaryAxes,
        }}
      />
    </div>
  );
}
