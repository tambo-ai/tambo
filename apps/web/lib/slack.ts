import { env } from "./env";
import {
  ConversationInfoResponse,
  CreateChannelResponse,
  InviteResponse,
  SlackAPIError,
} from "./types/slack";

const SLACK_API_BASE = "https://slack.com/api";

export async function callSlackAPI<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!env.SLACK_OAUTH_TOKEN) {
    throw new Error("SLACK_OAUTH_TOKEN environment variable is not set");
  }
  const response = await fetch(`${SLACK_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SLACK_OAUTH_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error((data as SlackAPIError).error);
  }

  return data as T;
}

interface CreateChannelResult {
  channelId: string;
  channelName: string;
  inviteLink: string;
}

export async function createSlackChannel(
  companyName: string,
  email: string,
): Promise<CreateChannelResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  // Validate email domain if needed
  if (env.DISALLOWED_EMAIL_DOMAINS) {
    const disallowedDomains = env.DISALLOWED_EMAIL_DOMAINS.split(",");
    const emailDomain = email.split("@")[1];

    if (disallowedDomains.includes(emailDomain)) {
      throw new Error(
        "Email domain not allowed. Please use a work email domain.",
      );
    }
  }

  const channelName = formatChannelName(companyName);

  // Check if channel exists
  try {
    await callSlackAPI<ConversationInfoResponse>("conversations.info", {
      channel: channelName,
    });
    throw new Error("Channel already exists");
  } catch (_error) {
    // Channel does not exist, proceed with creation
  }

  const channelData = await createChannel(channelName);
  const inviteData = await inviteUserToChannel(channelData.channel.id, email);
  await inviteInternalUser(channelData.channel.id);

  return {
    channelId: channelData.channel.id,
    channelName: channelData.channel.name,
    inviteLink: inviteData.url,
  };
}

function formatChannelName(companyName: string): string {
  const channelName = `tambo-${companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 65)}`;

  if (channelName.length < 7) {
    throw new Error("Company name results in invalid channel name");
  }

  return channelName;
}

async function createChannel(
  channelName: string,
): Promise<CreateChannelResponse> {
  const channelData = await callSlackAPI<CreateChannelResponse>(
    "conversations.create",
    {
      name: channelName,
      is_private: false,
    },
  );

  if (!channelData.channel.id) {
    throw new Error("Failed to create Slack channel: Invalid response");
  }

  return channelData;
}

async function inviteUserToChannel(
  channelId: string,
  email: string,
): Promise<InviteResponse> {
  const inviteData = await callSlackAPI<InviteResponse>(
    "conversations.inviteShared",
    {
      channel: channelId,
      emails: [email],
      // Grant the invited external user full-access (can invite/manage others)
      external_limited: false,
    },
  );

  if (!inviteData.invite_id) {
    throw new Error("Failed to create Slack invite: Invalid response");
  }

  return inviteData;
}

async function inviteInternalUser(channelId: string): Promise<void> {
  const internalUserId = env.INTERNAL_SLACK_USER_ID;
  if (!internalUserId) {
    throw new Error("INTERNAL_SLACK_USER_ID environment variable is not set");
  }

  await callSlackAPI("conversations.invite", {
    channel: channelId,
    users: internalUserId,
  });
}
