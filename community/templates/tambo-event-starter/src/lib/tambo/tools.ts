import { z } from "zod";
import { defineTool } from "@tambo-ai/react";
import {
  eventData,
  speakersData,
  scheduleData,
  sponsorsData,
  prizesData,
  faqsData,
  addRegistration,
  isEmailRegistered,
  getRegistrationByEmail,
} from "@/lib/mock-data";

// Define all Tambo tools using defineTool helper
export const tamboTools = [
  defineTool({
    name: "getEventDetails",
    description: "Get details about the current event including name, dates, venue, and registration status. Use this when user asks about the event or what this hackathon/conference is about.",
    tool: async () => {
      return {
        id: eventData.id,
        name: eventData.name,
        tagline: eventData.tagline,
        description: eventData.description,
        type: eventData.type,
        dates: eventData.dates,
        venue: `${eventData.venue.name}, ${eventData.venue.city}`,
        spotsRemaining: eventData.spotsRemaining,
        isRegistrationOpen: eventData.isRegistrationOpen,
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      id: z.string(),
      name: z.string(),
      tagline: z.string(),
      description: z.string(),
      type: z.string(),
      dates: z.object({ start: z.string(), end: z.string() }),
      venue: z.string(),
      spotsRemaining: z.number(),
      isRegistrationOpen: z.boolean(),
    }),
  }),

  defineTool({
    name: "registerParticipant",
    description: "Register a new participant for the event. Requires name, email, and ticket type. Use this when user wants to register or sign up for the event.",
    tool: async (input: { name: string; email: string; ticketType: string; company?: string }) => {
      // Check if already registered
      if (isEmailRegistered(input.email)) {
        const existing = getRegistrationByEmail(input.email);
        return {
          success: false,
          message: `This email is already registered! Registration ID: ${existing?.id}`,
          registrationId: existing?.id,
        };
      }

      // Check if spots available
      if (eventData.spotsRemaining <= 0) {
        return {
          success: false,
          message: "Sorry, the event is fully booked!",
        };
      }

      // Create registration
      const registration = addRegistration({
        name: input.name,
        email: input.email,
        ticketType: input.ticketType as "general" | "vip" | "student" | "early-bird",
        company: input.company,
      });

      // DEMO ONLY: This in-memory mutation is not persisted across requests
      // In production, use a database or proper state management
      eventData.spotsRemaining -= 1;

      return {
        success: true,
        message: `Welcome to ${eventData.name}, ${input.name}! Your registration is confirmed.`,
        registrationId: registration.id,
        ticketType: input.ticketType,
      };
    },
    inputSchema: z.object({
      name: z.string().describe("Full name of the participant"),
      email: z.string().email().describe("Email address"),
      ticketType: z.string().describe("Type of ticket: general, vip, or student"),
      company: z.string().optional().describe("Company or organization name"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      registrationId: z.string().optional(),
      ticketType: z.string().optional(),
    }),
  }),

  defineTool({
    name: "checkRegistrationStatus",
    description: "Check if a user is already registered using their email address. Use when user wants to verify their registration or asks if they're signed up.",
    tool: async (input: { email: string }) => {
      const registration = getRegistrationByEmail(input.email);
      
      if (registration) {
        return {
          isRegistered: true,
          name: registration.name,
          ticketType: registration.ticketType,
          registeredAt: registration.registeredAt,
          registrationId: registration.id,
        };
      }

      return {
        isRegistered: false,
        message: "No registration found with this email address.",
      };
    },
    inputSchema: z.object({
      email: z.string().email().describe("Email address to check"),
    }),
    outputSchema: z.object({
      isRegistered: z.boolean(),
      name: z.string().optional(),
      ticketType: z.string().optional(),
      registeredAt: z.string().optional(),
      registrationId: z.string().optional(),
      message: z.string().optional(),
    }),
  }),

  defineTool({
    name: "getSpeakers",
    description: "Get list of event speakers. Can filter by expertise area. Use when user asks about speakers, presenters, or who's speaking.",
    tool: async (input: { expertise?: string }) => {
      if (input.expertise) {
        return speakersData.filter((s) =>
          s.expertise.some((e) =>
            e.toLowerCase().includes(input.expertise!.toLowerCase())
          )
        );
      }
      return speakersData;
    },
    inputSchema: z.object({
      expertise: z.string().optional().describe("Filter by expertise area like 'ML', 'AI', 'Ethics'"),
    }),
    outputSchema: z.array(z.any()),
  }),

  defineTool({
    name: "getSchedule",
    description: "Get the event schedule. Can filter by day or track. Use when user asks about schedule, agenda, sessions, or timing.",
    tool: async (input: { day?: string; track?: string }) => {
      let schedule = scheduleData;

      if (input.day) {
        schedule = schedule.filter((d) =>
          d.dayLabel.toLowerCase().includes(input.day!.toLowerCase())
        );
      }

      if (input.track) {
        schedule = schedule.map((d) => ({
          ...d,
          sessions: d.sessions.filter(
            (s) => s.track?.toLowerCase().includes(input.track!.toLowerCase())
          ),
        }));
      }

      return schedule;
    },
    inputSchema: z.object({
      day: z.string().optional().describe("Filter by day like 'Day 1', 'Day 2'"),
      track: z.string().optional().describe("Filter by track like 'Technical', 'Business'"),
    }),
    outputSchema: z.array(z.any()),
  }),

  defineTool({
    name: "getSponsors",
    description: "Get list of event sponsors. Can filter by tier. Use when user asks about sponsors or partners.",
    tool: async (input: { tier?: string }) => {
      if (input.tier) {
        return sponsorsData.filter(
          (s) => s.tier.toLowerCase() === input.tier!.toLowerCase()
        );
      }
      return sponsorsData;
    },
    inputSchema: z.object({
      tier: z.string().optional().describe("Filter by tier: platinum, gold, silver, bronze, community"),
    }),
    outputSchema: z.array(z.any()),
  }),

  defineTool({
    name: "getPrizes",
    description: "Get list of prizes that can be won. Can filter by category. Use when user asks about prizes, rewards, or what they can win.",
    tool: async (input: { category?: string }) => {
      if (input.category) {
        return prizesData.filter(
          (p) => p.category.toLowerCase() === input.category!.toLowerCase()
        );
      }
      return prizesData;
    },
    inputSchema: z.object({
      category: z.string().optional().describe("Filter by category like 'Technical', 'Impact', 'Design'"),
    }),
    outputSchema: z.array(z.any()),
  }),

  defineTool({
    name: "getFAQs",
    description: "Get frequently asked questions. Can filter by category. Use when user has questions that might be in FAQ.",
    tool: async (input: { category?: string }) => {
      if (input.category) {
        return faqsData.filter(
          (f) => f.category?.toLowerCase() === input.category!.toLowerCase()
        );
      }
      return faqsData;
    },
    inputSchema: z.object({
      category: z.string().optional().describe("Filter by category like 'General', 'Teams', 'Technical'"),
    }),
    outputSchema: z.array(z.any()),
  }),

  defineTool({
    name: "getTickets",
    description: "Get available ticket types with prices and perks. Use when user asks about tickets, pricing, or costs.",
    tool: async () => {
      return eventData.tickets;
    },
    inputSchema: z.object({}),
    outputSchema: z.array(z.any()),
  }),

  defineTool({
    name: "getVenue",
    description: "Get venue information including address, coordinates, directions, and facilities. Use when user asks about location, venue, or how to get there.",
    tool: async () => {
      return eventData.venue;
    },
    inputSchema: z.object({}),
    outputSchema: z.any(),
  }),

  defineTool({
    name: "checkAvailability",
    description: "Check how many spots are available and registration status. Use when user asks if there's still room or availability.",
    tool: async () => {
      return {
        spotsTotal: eventData.spotsTotal,
        spotsRemaining: eventData.spotsRemaining,
        isRegistrationOpen: eventData.isRegistrationOpen,
        registrationDeadline: eventData.registrationDeadline,
        percentFull: Math.round(
          ((eventData.spotsTotal - eventData.spotsRemaining) / eventData.spotsTotal) * 100
        ),
      };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      spotsTotal: z.number(),
      spotsRemaining: z.number(),
      isRegistrationOpen: z.boolean(),
      registrationDeadline: z.string(),
      percentFull: z.number(),
    }),
  }),
];

export default tamboTools;
