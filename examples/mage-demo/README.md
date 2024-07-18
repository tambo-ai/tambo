# Hydra-AI Social App Demo

In this demo NextJS app, we showcase how the `hydra-ai` package can be used to create a social application where the AI chooses between different pre-built React components and hydrates them dynamically within a chatbox.

After each User message hydra will try to respond with one of the registered components.

The app uses several components that can be found under `/src/app/components` to display information in a way that makes sense based on the context.

## Usage

### Steps

1. **Add your OpenAI Key**

Create a file called `.env.local` under `/src/`.

Add your OpenAI Key, like:

```bash
OPENAI_API_KEY=<your key>
```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## About

Under `src/app/hydra-client.ts` we initialize Hydra and register the components we want Hydra to know about:

```jsx
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
```

To handle interaction with Hydra and showing the resulting components, we use the `<HydraChat/>` component from the `hydra-ai` package.

```jsx
<HydraChat
  hydraClient={hydra}
  initialMessages={[
    {
      sender: "Hydra",
      message: `This is a demo social app made using Hydra. Try 'Show me people who use NextJS' or 'Draft a message to any react developers asking them to try out Hydra' 
                or 'Show me discussions about React'`,
      type: "text",
    },
  ]}
  inputBackgroundColor="white"
  inputTextColor="black"
/>
```

Behind the scenes, the `hydra-ai` package sets up a NextJS server action that HydraClient calls so that interaction with AI happens server-side.

## Report a bug or Request a feature

Make a GitHub issue [here.](https://github.com/michaelmagan/hydraai/issues/new)
