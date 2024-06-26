import React from "react";

const HistoricalEventCard: React.FC<{
  title: string;
  date: string;
  description: string;
}> = ({ title, date, description }) => (
  <div className="border p-4 rounded-lg my-4 bg-white text-gray-700">
    <h2 className="mb-2">{title}</h2>
    <h4 className="mb-2">{date}</h4>
    <p>{description}</p>
  </div>
);

export default HistoricalEventCard;
