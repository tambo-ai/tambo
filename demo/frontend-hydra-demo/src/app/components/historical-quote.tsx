import React from "react";

const HistoricalQuote: React.FC<{
  quote: string;
  author: string;
  year: string;
}> = ({ quote, author, year }) => (
  <div className="p-4 rounded-lg my-4 bg-white text-gray-700">
    <blockquote className="mb-2">
      <p className="mb-2">{quote}</p>
      <footer className="text-sm">
        — {author}, {year}
      </footer>
    </blockquote>
  </div>
);

export default HistoricalQuote;
