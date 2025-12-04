import { z } from "zod/v3";

export const CreateSlackChannelSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
});

export type CreateSlackChannelInput = z.infer<typeof CreateSlackChannelSchema>;

export interface SlackAPIError {
  ok: false;
  error: string;
}

export interface CreateChannelResponse {
  ok: true;
  channel: {
    id: string;
    name: string;
  };
}

export interface InviteResponse {
  ok: true;
  invite_id: string;
  url: string;
  is_legacy_shared_channel: boolean;
  conf_code: string;
  warning: string;
  response_metadata: {
    warnings: string[];
  };
}

export interface ConversationInfoResponse {
  ok: true;
  channel?: {
    id: string;
    name: string;
  };
}
