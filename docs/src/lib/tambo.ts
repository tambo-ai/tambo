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
      "A card component that directs users to the tambo dashboard, whenever a user asks to go to the dashboard, use this component to redirect them to the dashboard.",
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
