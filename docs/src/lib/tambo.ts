"use client";

import { DashboardCardComponent } from "@/components/dashboard-card";
import { DiscordInvite } from "@/components/discord-invite";
import { GitHubIssueCreator } from "@/components/github-issue-creator";
import { TamboComponent } from "@tambo-ai/react";
import { z } from "zod/v3";

export const components: TamboComponent[] = [
  {
    name: "DashboardCard",
    description:
      "A card explaining that Tambo Cloud is shutting down (new signups are closed; the hosted API stops responding after October 31, 2026), linking to the shutdown announcement and the self-hosting guide. Whenever a user asks to go to the Tambo dashboard or console, sign up, log in, or get a Tambo Cloud API key, use this component.",
    component: DashboardCardComponent,
    propsSchema: z.object({}),
  },
  {
    name: "GitHubIssueCreator",
    description:
      "A component that creates a GitHub issue, whenever a user asks to create an issue, or says something is wrong, use this component to create an issue on GitHub.",
    component: GitHubIssueCreator,
    propsSchema: z.object({}),
  },
  {
    name: "DiscordInvite",
    description:
      "A component that invites users to join the Tambo Discord server, whenever a user asks about community, support, Discord, or getting help, use this component to invite them to Discord.",
    component: DiscordInvite,
    propsSchema: z.object({}),
  },
];
