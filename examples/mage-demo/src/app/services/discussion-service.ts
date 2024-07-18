import { Discussion } from "../model/discussion";

export const getDiscussions = async (): Promise<Discussion[]> => {
  return sampleDiscussions;
};

export const sampleDiscussions: Discussion[] = [
  {
    id: "1",
    title: "Next.js Best Practices",
    description: "Discussion about best practices when using Next.js",
    createdDateIso: "2024-06-01T00:00:00Z",
    messages: [
      {
        id: "1",
        discussionId: "1",
        from: "Alice",
        message:
          "What are some best practices for optimizing Next.js performance?",
        createdDateIso: "2024-06-01T00:00:00Z",
      },
      {
        id: "2",
        discussionId: "1",
        from: "Bob",
        message: "I recommend using static generation whenever possible.",
        createdDateIso: "2024-06-01T01:00:00Z",
      },
      {
        id: "3",
        discussionId: "1",
        from: "Charlie",
        message:
          "Don't forget to utilize dynamic imports to reduce the initial load time.",
        createdDateIso: "2024-06-01T02:00:00Z",
      },
    ],
  },
  {
    id: "2",
    title: "Launching a New Product",
    description: "Strategies for successfully launching a new product idea",
    createdDateIso: "2024-06-02T00:00:00Z",
    messages: [
      {
        id: "1",
        discussionId: "2",
        from: "David",
        message:
          "What are the first steps to take when launching a new product?",
        createdDateIso: "2024-06-02T00:00:00Z",
      },
      {
        id: "2",
        discussionId: "2",
        from: "Eve",
        message:
          "Market research is crucial. Understand your target audience and their needs.",
        createdDateIso: "2024-06-02T01:00:00Z",
      },
      {
        id: "3",
        discussionId: "2",
        from: "Frank",
        message:
          "Create a solid marketing plan and leverage social media to build anticipation.",
        createdDateIso: "2024-06-02T02:00:00Z",
      },
      {
        id: "4",
        discussionId: "2",
        from: "Grace",
        message:
          "Don’t forget to gather feedback from early users to improve the product.",
        createdDateIso: "2024-06-02T03:00:00Z",
      },
    ],
  },
  {
    id: "3",
    title: "React vs. Angular",
    description: "Discussion comparing React and Angular",
    createdDateIso: "2024-06-03T00:00:00Z",
    messages: [
      {
        id: "1",
        discussionId: "3",
        from: "Hank",
        message: "Which one is better for a new project: React or Angular?",
        createdDateIso: "2024-06-03T00:00:00Z",
      },
      {
        id: "2",
        discussionId: "3",
        from: "Ivy",
        message:
          "It depends on the project requirements. React offers more flexibility.",
        createdDateIso: "2024-06-03T01:00:00Z",
      },
      {
        id: "3",
        discussionId: "3",
        from: "Jack",
        message:
          "Angular provides a more complete solution with its built-in features.",
        createdDateIso: "2024-06-03T02:00:00Z",
      },
    ],
  },
];
