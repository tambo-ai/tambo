import React from "react";

const TimelineCard: React.FC<{
  period: string;
  events: { year: string; event: string }[];
}> = ({ period, events }) => (
  <div className="relative border border-gray-400 p-4 rounded-lg my-4 bg-white text-gray-700">
    <h2 className="mb-2">{period}</h2>
    <div className="absolute left-5 top-10 bottom-2 w-1 bg-blue-500"></div>
    <ul className="list-none pl-10">
      {events.map((e, index) => (
        <li key={index} className="relative mb-5">
          <div className="absolute left-[-39px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <strong>{e.year}</strong>: {e.event}
        </li>
      ))}
    </ul>
  </div>
);

export default TimelineCard;
