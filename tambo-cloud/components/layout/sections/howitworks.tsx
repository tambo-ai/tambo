"use client";

import React from "react";
import { motion } from "framer-motion";
import Code from "@/components/code";
import Example from "@/components/example";

const codeExamples = {
  registerComponents: `import { HydraClient } from "hydra-ai";
import TransferMoney from "./components/transfer-money";
import FindTransaction from "./components/find-transaction";
import TakeLoan from "./components/take-loan";

const hydra = new HydraClient();

hydra.registerComponent("TransferMoney", TransferMoney, {
  fromAccount: "string",
  toAccount: "string",
  amount: "number",
  currency: '"USD" | "EUR" | "GBP"',
});

hydra.registerComponent("FindTransaction", FindTransaction, {
  transactionId: "string",
  dateRange: {
    start: "Date",
    end: "Date",
  },
});

hydra.registerComponent("TakeLoan", TakeLoan, {
  amount: "number",
  interestRate: "number",
  term: "number",
  purpose: '"personal" | "business" | "mortgage"',
});

export default hydra;`,

  useHydraComponent: `"use client";

import { ReactElement, useEffect, useState } from "react";
import hydra from "./hydra-client";

export default function BankingDashboard() {
  const [bankingComponent, setBankingComponent] = 
    useState<ReactElement | null>(null);

  const generateBankingUI = async () => {
    const component = await hydra.generateComponent(
      "Create a UI for transferring money between accounts"
    );
    setBankingComponent(component);
  };

  useEffect(() => {
    generateBankingUI();
  }, []);

  return (
    <main>
      <h1>Banking Dashboard</h1>
      {bankingComponent}
      <button onClick={generateBankingUI}>Generate New Banking UI</button>
    </main>
  );
}`,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const codeVariantsRight = {
  hidden: { opacity: 0, x: 100, rotate: 10 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const codeVariantsLeft = {
  hidden: { opacity: 0, x: -100, rotate: -10 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export const HowItWorksSection = () => {
  return (
    <section className="bg-background pb-24 place-items-center lg:max-w-screen-xl lg:w-[75%] gap-8 mx-auto py-20 md:py-32">
      <div className="container mx-auto">
        <motion.h2
          className="text-4xl font-bold text-center mb-16"
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          How It Works
        </motion.h2>
        <div className="space-y-16">
          {/* Row 1 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div className="space-y-4" variants={textVariants}>
              <h3 className="text-2xl font-semibold">
                1. Register Your Components
              </h3>
              <p className="text-lg text-muted-foreground">
                Define and register your custom components with Hydra AI to
                enable AI-driven rendering.
              </p>
            </motion.div>
            <motion.div variants={codeVariantsRight}>
              <Code
                language="javascript"
                fileName="app/hydra-client.ts"
                code={codeExamples.registerComponents}
              />
            </motion.div>
          </motion.div>

          {/* Row 2 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div
              className="space-y-4 md:order-2"
              variants={textVariants}
            >
              <h3 className="text-2xl font-semibold">
                2. Use Hydra to Generate Components
              </h3>
              <p className="text-lg text-muted-foreground">
                Utilize Hydra AI to dynamically generate and render components
                based on user input or context.
              </p>
            </motion.div>
            <motion.div variants={codeVariantsLeft}>
              <Code
                language="jsx"
                fileName="app/page.tsx"
                code={codeExamples.useHydraComponent}
              />
            </motion.div>
          </motion.div>

          {/* Row 3 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div className="space-y-4" variants={textVariants}>
              <h3 className="text-2xl font-semibold">
                3. Interact with Generated UI
              </h3>
              <p className="text-lg text-muted-foreground">
                Engage with your Hydra AI components through interactive
                elements, allowing users to dynamically modify and control the
                generated UI.
              </p>
            </motion.div>
            <motion.div variants={codeVariantsRight}>
              <Example />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
