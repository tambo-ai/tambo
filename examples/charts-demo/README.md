# Hydra-AI Charts Demo

In this demo NextJS app, we showcase how the `hydra-ai` package can be used to create an application where you can chat with an AI about your finances, and the AI can control charts to help visualize them.

After each User message hydra will try to respond with one of the registered components.

In this demo, hydra can use a PieChart and a LineGraph that can be found under `/src/app/components` to display information in a way that makes sense based on the context.

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
  "PieChart",
  HydraPieChart,
  {
    data: '{ name: "string", value: "number" }[]',
  },
  getTransactions
);

hydra.registerComponent(
  "LineGraph",
  HydraLineGraph,
  {
    xValues: "string[]",
    series: "{ name: string; yValues: number[] }[]",
  },
  getTransactions
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
      message: `I am a Hydra-powered AI agent that has access to demo transaction data, with the ability to show charts. Try asking about your monthly spending.`,
      type: "text",
    },
  ]}
  inputBackgroundColor="#050C0F"
  inputTextColor="white"
  aiMessageColor="#B5D3BF"
  userMessageColor="white"
  handleComponent={handleHydraComponent}
  loadingIconColor="white"
/>
```

Behind the scenes, the `hydra-ai` package sets up a NextJS server action that HydraClient calls so that interaction with AI happens server-side.

Finally, the hydrated component returned from Hydra is used:

```jsx
  const [hydraComponent, setHydraComponent] =
    React.useState<React.ReactElement | null>(null);

  const handleHydraComponent = (component: React.ReactElement) => {
    setHydraComponent(component);
  };

  ...

  <div>{hydraComponent}</div>
```

## Report a bug or Request a feature

Make a GitHub issue [here.](https://github.com/michaelmagan/hydraai/issues/new)
