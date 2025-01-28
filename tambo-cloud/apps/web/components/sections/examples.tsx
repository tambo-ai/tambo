import { FeatureSelector } from "@/components/feature-selector";
import { Section } from "@/components/section";
import { ExampleChat } from "@/components/sections/example-chat";
import { codeToHtml } from "shiki";

interface FeatureOption {
  id: number;
  title: string;
  description: string;
  code: string;
  isComponent?: boolean;
}

const featureOptions: FeatureOption[] = [
  {
    id: 1,
    title: "Define a Component",
    description: "Define a component with React.",
    code: `interface TransferProps {
  amount: number;
  recipient: string;
  accountType?: "checking" | "savings";
}

const TransferCard = ({ amount, recipient, accountType = "checking" }: TransferProps) => (
  <div className="transfer-card">
    <h2>Transfer \${amount} to {recipient}</h2>
    <p>From: {accountType}</p>
  </div>
);`,
    isComponent: false,
  },
  {
    id: 2,
    title: "Register Components",
    description: "Register it with Hydra AI",
    code: `hydra.registerComponent({
  name: "TransferCard",
  description: "Money transfer component",
  component: TransferCard,
  propsDefinition: {
    amount: { type: "number", default: 500 },
    recipient: { type: "string", default: "Mom" },
    accountType: { 
      type: "string", 
      enum: ["checking", "savings"]
    }
  }
});`,
    isComponent: false,
  },
  {
    id: 3,
    title: "Add tool calls",
    description: "Add your APIs to Hydra AI",
    code: `const transferMoney = {
  definition: {
    name: "transfer",
    parameters: ["amount", "recipient"]
  },
  execute: async (amount, recipient) => {
    return await bankAPI.transfer(amount, recipient);
  }
}
hydra.registerComponent({
  name: "TransferCard",
  ...
  contextTools: [{
    definition: {
      name: "transferMoney",
      description: "Executes a money transfer", 
      parameters: [
        { name: "amount", type: "number" },
        { name: "recipient", type: "string" }
      ]
    },
    getComponentContext: async (amount, recipient) => {
      return await bankAPI.transfer(amount, recipient);
    }
  }]
});`,
    isComponent: false,
  },
  {
    id: 4,
    title: "Render Interactive UI",
    description: "Surface the right features to the user",
    code: "",
    isComponent: true,
  },
];

export async function Examples() {
  const features = await Promise.all(
    featureOptions.map(async (feature) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      code: feature.isComponent ? (
        <ExampleChat />
      ) : (
        await codeToHtml(feature.code, {
          lang: "typescript",
          theme: "github-dark",
        })
      ),
    })),
  );

  return (
    <Section id="how-it-works" title="How it works">
      <div className="border-x border-t">
        <FeatureSelector features={features} />
      </div>
    </Section>
  );
}
