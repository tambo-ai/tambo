import { z } from "zod";
import { TamboComponent } from "@tambo-ai/react";

import { EventHero } from "@/components/tambo/EventHero";
import { RegistrationForm } from "@/components/tambo/RegistrationForm";
import { ScheduleView } from "@/components/tambo/ScheduleView";
import { SpeakerCard } from "@/components/tambo/SpeakerCard";
import { SpeakerGrid } from "@/components/tambo/SpeakerGrid";
import { VenueMap } from "@/components/tambo/VenueMap";
import { FAQAccordion } from "@/components/tambo/FAQAccordion";
import { CountdownTimer } from "@/components/tambo/CountdownTimer";
import { PrizeShowcase } from "@/components/tambo/PrizeShowcase";
import { SponsorsGrid } from "@/components/tambo/SponsorsGrid";
import { TicketCard } from "@/components/tambo/TicketCard";

import {
  EventHeroPropsSchema,
  RegistrationFormPropsSchema,
  ScheduleViewPropsSchema,
  SpeakerCardPropsSchema,
  SpeakerGridPropsSchema,
  VenueMapPropsSchema,
  FAQAccordionPropsSchema,
  CountdownTimerPropsSchema,
  PrizeShowcasePropsSchema,
  SponsorsGridPropsSchema,
  TicketCardPropsSchema,
} from "@/types";

// Define all Tambo-registered components
export const tamboComponents: TamboComponent[] = [
  {
    name: "EventHero",
    description: "Displays the main event hero banner with event name, tagline, dates, venue, and registration status. Use this when user asks about the event, event details, or wants to see event overview.",
    component: EventHero,
    propsSchema: EventHeroPropsSchema,
  },
  {
    name: "RegistrationForm",
    description: "Interactive registration form for users to sign up for the event. Use when user wants to register, sign up, or book a ticket. Can pre-fill name and email if provided.",
    component: RegistrationForm,
    propsSchema: RegistrationFormPropsSchema,
  },
  {
    name: "ScheduleView",
    description: "Displays the event schedule organized by day with sessions, times, speakers, and locations. Use when user asks about schedule, agenda, sessions, or what's happening when.",
    component: ScheduleView,
    propsSchema: ScheduleViewPropsSchema,
  },
  {
    name: "SpeakerCard",
    description: "Shows a single speaker's information including photo, bio, role, company, and social links. Use when user asks about a specific speaker.",
    component: SpeakerCard,
    propsSchema: SpeakerCardPropsSchema,
  },
  {
    name: "SpeakerGrid",
    description: "Displays a grid of all speakers with their information. Use when user asks about speakers, who's speaking, or presenters at the event.",
    component: SpeakerGrid,
    propsSchema: SpeakerGridPropsSchema,
  },
  {
    name: "VenueMap",
    description: "Shows venue location, address, directions, and facilities. Use when user asks about location, venue, how to get there, or parking.",
    component: VenueMap,
    propsSchema: VenueMapPropsSchema,
  },
  {
    name: "FAQAccordion",
    description: "Displays frequently asked questions in an accordion format. Use when user asks questions that might be in FAQ, or asks for help/common questions.",
    component: FAQAccordion,
    propsSchema: FAQAccordionPropsSchema,
  },
  {
    name: "CountdownTimer",
    description: "Shows a countdown timer to the event start. Use when user asks when the event starts, how much time is left, or countdown.",
    component: CountdownTimer,
    propsSchema: CountdownTimerPropsSchema,
  },
  {
    name: "PrizeShowcase",
    description: "Displays all prizes and rewards that can be won at the event. Use when user asks about prizes, rewards, what they can win, or incentives.",
    component: PrizeShowcase,
    propsSchema: PrizeShowcasePropsSchema,
  },
  {
    name: "SponsorsGrid",
    description: "Shows all sponsors organized by tier (platinum, gold, silver, etc.). Use when user asks about sponsors, partners, or who's supporting the event.",
    component: SponsorsGrid,
    propsSchema: SponsorsGridPropsSchema,
  },
  {
    name: "TicketCard",
    description: "Displays available ticket types with prices, perks, and availability. Use when user asks about tickets, pricing, ticket options, or costs.",
    component: TicketCard,
    propsSchema: TicketCardPropsSchema,
  },
];

export default tamboComponents;
