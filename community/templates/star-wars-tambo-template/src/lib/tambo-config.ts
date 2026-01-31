import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { CharacterCard } from "@/components/tambo/CharacterCard";
import { StarshipCard } from "@/components/tambo/StarshipCard";
import { OpeningCrawl } from "@/components/tambo/OpeningCrawl";
import { getCharacter, getStarship, swapiToolSchema } from "@/lib/swapi-tool";

export const tamboComponents: TamboComponent[] = [
  {
    name: "CharacterCard",
    description:
      "Display a Star Wars character with hologram effect. Shows name, species, homeworld, and affiliation (light/dark/neutral). Use forceStrength (1-10) for Force-sensitive characters.",
    component: CharacterCard,
    propsSchema: z.object({
      name: z.string().describe("Full name of the character"),
      species: z
        .string()
        .describe("Species of the character (e.g., Human, Wookiee, Droid)"),
      homeworld: z.string().describe("Home planet of the character"),
      affiliation: z
        .enum(["light", "dark", "neutral"])
        .describe("Light side, dark side, or neutral"),
      forceStrength: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe(
          "Force power level 0-10, only for Force-sensitive characters",
        ),
    }),
  },
  {
    name: "StarshipCard",
    description:
      "Display a Star Wars starship with detailed specs. Shows model, manufacturer, crew capacity, passenger capacity, max speed, and hyperdrive rating.",
    component: StarshipCard,
    propsSchema: z.object({
      name: z.string().describe("Name of the starship"),
      model: z.string().describe("Model designation"),
      manufacturer: z.string().describe("Company that built the starship"),
      crew: z.string().describe("Required crew size"),
      passengers: z.string().describe("Passenger capacity"),
      maxSpeed: z.string().describe("Maximum atmospheric speed"),
      hyperdriveRating: z.string().describe("Hyperdrive class rating"),
    }),
  },
  {
    name: "OpeningCrawl",
    description:
      "Display an iconic Star Wars opening crawl with scrolling text. Use for dramatic introductions or story summaries. Auto-dismisses after 20 seconds or on click.",
    component: OpeningCrawl,
    propsSchema: z.object({
      title: z.string().describe("Title of the episode or story"),
      episode: z.number().optional().describe("Episode number (optional)"),
      content: z
        .string()
        .describe(
          "The scrolling text content - keep to 2-3 paragraphs for best effect",
        ),
    }),
  },
];

export const tamboTools: TamboTool[] = [
  {
    name: "fetchStarWarsData",
    description:
      "Fetch real Star Wars data from SWAPI (Star Wars API). Can retrieve character information (name, species, homeworld) or starship data (model, specs, crew). Use this before displaying CharacterCard or StarshipCard to get accurate data.",
    tool: async ({
      type,
      name,
    }: {
      type: "character" | "starship";
      name: string;
    }) => {
      if (type === "character") {
        return await getCharacter(name);
      } else {
        return await getStarship(name);
      }
    },
    toolSchema: swapiToolSchema,
  },
];
