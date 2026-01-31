import { z } from "zod";

// ============================================
// Event Types & Schemas
// ============================================

export const EventTypeSchema = z.enum(["hackathon", "conference", "workshop"]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const TicketTypeSchema = z.enum(["general", "vip", "student", "early-bird"]);
export type TicketType = z.infer<typeof TicketTypeSchema>;

export const TicketSchema = z.object({
  id: z.string(),
  type: TicketTypeSchema,
  name: z.string(),
  price: z.number(),
  currency: z.string().default("USD"),
  perks: z.array(z.string()),
  available: z.boolean(),
  spotsRemaining: z.number().optional(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const VenueSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  mapUrl: z.string().optional(),
  directions: z.string().optional(),
  facilities: z.array(z.string()).optional(),
});
export type Venue = z.infer<typeof VenueSchema>;

export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  type: EventTypeSchema,
  dates: z.object({
    start: z.string(),
    end: z.string(),
  }),
  registrationDeadline: z.string(),
  venue: VenueSchema,
  tickets: z.array(TicketSchema),
  spotsTotal: z.number(),
  spotsRemaining: z.number(),
  isRegistrationOpen: z.boolean(),
  heroImage: z.string().optional(),
  theme: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
  }).optional(),
});
export type Event = z.infer<typeof EventSchema>;

// ============================================
// Speaker Types & Schemas
// ============================================

export const SocialLinksSchema = z.object({
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});
export type SocialLinks = z.infer<typeof SocialLinksSchema>;

export const SpeakerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string(),
  bio: z.string(),
  expertise: z.array(z.string()),
  image: z.string(),
  social: SocialLinksSchema.optional(),
  isFeatured: z.boolean().optional(),
});
export type Speaker = z.infer<typeof SpeakerSchema>;

// ============================================
// Schedule Types & Schemas
// ============================================

export const SessionTypeSchema = z.enum([
  "keynote",
  "workshop",
  "talk",
  "panel",
  "networking",
  "break",
  "ceremony",
  "hackathon",
]);
export type SessionType = z.infer<typeof SessionTypeSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: SessionTypeSchema,
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  speakerId: z.string().optional(),
  speakerName: z.string().optional(),
  track: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type Session = z.infer<typeof SessionSchema>;

export const ScheduleDaySchema = z.object({
  date: z.string(),
  dayLabel: z.string(),
  sessions: z.array(SessionSchema),
});
export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;

// ============================================
// Registration Types & Schemas
// ============================================

export const RegistrationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  ticketType: TicketTypeSchema,
  teamName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
  agreedToTerms: z.boolean().optional(),
  registeredAt: z.string().optional(),
});
export type Registration = z.infer<typeof RegistrationSchema>;

export const RegistrationResponseSchema = z.object({
  success: z.boolean(),
  registrationId: z.string().optional(),
  message: z.string(),
  ticket: TicketSchema.optional(),
});
export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;

// ============================================
// Sponsor Types & Schemas
// ============================================

export const SponsorTierSchema = z.enum(["platinum", "gold", "silver", "bronze", "community"]);
export type SponsorTier = z.infer<typeof SponsorTierSchema>;

export const SponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string(),
  website: z.string(),
  tier: SponsorTierSchema,
  description: z.string().optional(),
});
export type Sponsor = z.infer<typeof SponsorSchema>;

// ============================================
// Prize Types & Schemas
// ============================================

export const PrizeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  value: z.union([z.string(), z.number()]),
  category: z.string(),
  icon: z.string().optional(),
});
export type Prize = z.infer<typeof PrizeSchema>;

// ============================================
// FAQ Types & Schemas
// ============================================

export const FAQSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string().optional(),
});
export type FAQ = z.infer<typeof FAQSchema>;

// ============================================
// Component Props Schemas (for Tambo)
// These schemas should be simple with optional fields
// to allow AI to render components easily
// ============================================

export const EventHeroPropsSchema = z.object({
  name: z.string().optional().default("AI Innovation Hackathon 2026").describe("The name of the event"),
  tagline: z.string().optional().default("Build the Future with AI").describe("A catchy tagline for the event"),
  type: EventTypeSchema.optional().default("hackathon").describe("Type of event"),
  startDate: z.string().optional().default("2026-03-15").describe("Event start date"),
  endDate: z.string().optional().default("2026-03-17").describe("Event end date"),
  venue: z.string().optional().default("Tech Innovation Center, San Francisco").describe("Venue name and location"),
  spotsRemaining: z.number().optional().default(146).describe("Number of spots still available"),
  isRegistrationOpen: z.boolean().optional().default(true).describe("Whether registration is currently open"),
});
export type EventHeroProps = z.infer<typeof EventHeroPropsSchema>;

export const RegistrationFormPropsSchema = z.object({
  eventName: z.string().optional().default("AI Innovation Hackathon 2026").describe("Name of the event"),
  prefilledName: z.string().optional().describe("Pre-filled name if user provided"),
  prefilledEmail: z.string().optional().describe("Pre-filled email if user provided"),
});
export type RegistrationFormProps = z.infer<typeof RegistrationFormPropsSchema>;

export const ScheduleViewPropsSchema = z.object({
  selectedDay: z.string().optional().describe("Currently selected day to display"),
  selectedTrack: z.string().optional().describe("Filter by track if applicable"),
});
export type ScheduleViewProps = z.infer<typeof ScheduleViewPropsSchema>;

export const SpeakerCardPropsSchema = z.object({
  speakerId: z.string().optional().describe("ID of the speaker to display"),
  name: z.string().optional().describe("Speaker's full name"),
  role: z.string().optional().describe("Speaker's job title"),
  company: z.string().optional().describe("Speaker's company"),
  bio: z.string().optional().describe("Short biography"),
  image: z.string().optional().describe("URL to speaker's photo"),
});
export type SpeakerCardProps = z.infer<typeof SpeakerCardPropsSchema>;

export const SpeakerGridPropsSchema = z.object({
  filterExpertise: z.string().optional().describe("Filter speakers by expertise"),
  showFeaturedOnly: z.boolean().optional().describe("Show only featured speakers"),
});
export type SpeakerGridProps = z.infer<typeof SpeakerGridPropsSchema>;

export const VenueMapPropsSchema = z.object({
  showDirections: z.boolean().optional().default(true).describe("Whether to show directions"),
});
export type VenueMapProps = z.infer<typeof VenueMapPropsSchema>;

export const FAQAccordionPropsSchema = z.object({
  category: z.string().optional().describe("Filter FAQs by category"),
});
export type FAQAccordionProps = z.infer<typeof FAQAccordionPropsSchema>;

export const CountdownTimerPropsSchema = z.object({
  targetDate: z.string().optional().default("2026-03-15T09:00:00").describe("The date to count down to"),
  label: z.string().optional().default("Event starts in").describe("Label for the countdown"),
});
export type CountdownTimerProps = z.infer<typeof CountdownTimerPropsSchema>;

export const PrizeShowcasePropsSchema = z.object({
  category: z.string().optional().describe("Filter prizes by category"),
  showTopOnly: z.boolean().optional().describe("Show only top prizes"),
});
export type PrizeShowcaseProps = z.infer<typeof PrizeShowcasePropsSchema>;

export const SponsorsGridPropsSchema = z.object({
  tier: SponsorTierSchema.optional().describe("Filter by sponsor tier"),
});
export type SponsorsGridProps = z.infer<typeof SponsorsGridPropsSchema>;

export const TicketCardPropsSchema = z.object({
  highlightedType: TicketTypeSchema.optional().describe("Ticket type to highlight"),
  showAvailableOnly: z.boolean().optional().describe("Show only available tickets"),
});
export type TicketCardProps = z.infer<typeof TicketCardPropsSchema>;
