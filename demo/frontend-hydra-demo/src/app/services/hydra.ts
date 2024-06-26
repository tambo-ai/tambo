import Hydra from "hydra-ai";
import HistoricalEventCard from "../components/historical-event-card";
import HistoricalFigureCard from "../components/historical-figure-card";
import HistoricalQuote from "../components/historical-quote";
import TimelineCard from "../components/timeline-card";

export const initHydra = (openAIKey: string) => {
  const hydra = new Hydra(openAIKey);

  hydra.registerComponent("HistoricalEventCard", HistoricalEventCard, {
    title: "string",
    date: "string",
    description: "string",
  });

  hydra.registerComponent("HistoricalFigureCard", HistoricalFigureCard, {
    name: "string",
    birthDate: "string",
    deathDate: "string",
    bio: "string",
    awards: "string",
  });

  hydra.registerComponent("TimelineCard", TimelineCard, {
    period: "string",
    events: "Array<{ year: string, event: string }>",
  });

  hydra.registerComponent("HistoricalQuote", HistoricalQuote, {
    quote: "string",
    author: "string",
    year: "string",
  });

  return hydra;
};
