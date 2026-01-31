'use client';

import React from 'react';
import {
  TamboProvider as BaseTamboProvider,
  currentTimeContextHelper,
  currentPageContextHelper,
} from '@tambo-ai/react';
import { tamboComponents } from '@/lib/tambo/components';
import { tamboTools } from '@/lib/tambo/tools';
import { eventData, speakersData, scheduleData } from '@/lib/mock-data';

// Custom context helper for event-specific information
const eventContextHelper = () => {
  return `
Current Event: ${eventData.name}
Event Dates: ${eventData.dates.start} to ${eventData.dates.end}
Location: ${eventData.venue.city}, ${eventData.venue.country}
Venue: ${eventData.venue.name}
Registration Status: ${eventData.isRegistrationOpen ? 'Open' : 'Closed'}
Total Speakers: ${speakersData.length}
Schedule Days: ${scheduleData.length}
Theme: ${eventData.theme?.primaryColor || 'Purple/Indigo'}

This is an AI-powered hackathon focused on innovation and building practical applications.
Users can ask about:
- Event details, schedule, and venue information
- Speaker profiles and their sessions
- Registration process and ticket types
- Prizes and awards
- Sponsors and partners
- FAQs and general help

Available Ticket Types:
${eventData.tickets.map((t) => `- ${t.name}: $${t.price} (${t.spotsRemaining || 0} spots remaining)`).join('\n')}

Key Deadlines:
- Registration Deadline: ${eventData.registrationDeadline}
- Event Start: ${eventData.dates.start}

When rendering UI components:
- Use EventHero for showing the main event overview
- Use ScheduleView to display the full schedule
- Use SpeakerGrid or SpeakerCard for speaker information
- Use RegistrationForm when the user wants to register
- Use VenueMap for location/venue queries
- Use CountdownTimer for countdown-related queries
- Use PrizeShowcase for prize information
- Use SponsorsGrid for sponsor information
- Use TicketCard for ticket/pricing information
`
};

interface TamboProviderProps {
  children: React.ReactNode;
}

export function TamboProvider({ children }: TamboProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    console.warn('NEXT_PUBLIC_TAMBO_API_KEY is not set. Chat functionality will be limited.');
  }

  return (
    <BaseTamboProvider
      apiKey={apiKey || ''}
      components={tamboComponents}
      tools={tamboTools}
      contextHelpers={{
        userTime: currentTimeContextHelper,
        userPage: currentPageContextHelper,
        eventContext: eventContextHelper,
      }}
    >
      {children}
    </BaseTamboProvider>
  );
}

export default TamboProvider;
