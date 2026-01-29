import {
    ShowUserProfile,
    showUserProfileSchema,
} from "@/components/tambo/show-user-profile";
import { TamboComponent } from "@tambo-ai/react";

export const components: TamboComponent[] = [
  {
    name: "ShowUserProfile",
    description:
      "Displays the current user's profile information including their User ID and email address from Clerk. Use this when the user asks to see their profile, user info, account details, or wants to know their user ID or email.",
    component: ShowUserProfile,
    propsSchema: showUserProfileSchema,
  },
];

export const tools = [];
