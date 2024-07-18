import { HydraClient } from "hydra-ai";
import { DiscussionList } from "./components/discussion-list";
import { ProfileCardList } from "./components/profile-card-list";
import { SendMessageList } from "./components/send-message-list";
import { getDiscussions } from "./services/discussion-service";
import { getProfiles } from "./services/profile-service";

const hydra = new HydraClient();

hydra.registerComponent(
  "ProfileCardList",
  ProfileCardList,
  {
    profiles: "{id: string, name: string, imageUrl: string, about: string}[]",
  },
  getProfiles
);

hydra.registerComponent("SendMessageList", SendMessageList, {
  messages: "{id: string, to: string, message: string}[]",
});

hydra.registerComponent(
  "DiscussionList",
  DiscussionList,
  {
    discussions:
      "{id: string, title: string, description: string, createdDateIso: string, messages: {id: string, discussionId: string, from: string, message: string, createdDateIso: string}[]}[]",
  },
  getDiscussions
);

export default hydra;
