export interface Discussion {
  id: string;
  title: string;
  description: string;
  createdDateIso: string;
  messages: DiscussionMessage[];
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  from: string;
  message: string;
  createdDateIso: string;
}
