import React from "react";

interface HistoricalFigureCardProps {
  name: string;
  birthDate: string;
  deathDate: string;
  bio: string;
  awards: string;
}

const HistoricalFigureCard: React.FC<HistoricalFigureCardProps> = ({
  name,
  birthDate,
  deathDate,
  bio,
  awards,
}) => (
  <div className="w-full max-w-sm border rounded-lg bg-white shadow-md">
    <div className="grid gap-4 p-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">{name}</h3>
        <p className="text-gray-600">{bio}</p>
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Born: {birthDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Died: {deathDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <AwardIcon className="w-4 h-4" />
            <span>Awards: {awards}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface IconProps {
  className?: string;
}

function AwardIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
      <circle cx="12" cy="8" r="6" />
    </svg>
  );
}

function CalendarIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export default HistoricalFigureCard;
