# Hydra AI

A tool to generate React components on-the-fly using AI.

### note:

This package is a work-in-progress. By following the instructions here currently, you will be exposing your OpenAI key to users, unless you have your users enter their own key. Our advice is to use this only for experimentation until the package structure is updated.

## Getting started

1. **Install the package**

```shell
npm i hydra-ai
```

2. **Initialize Hydra and register components**

To create a list of components that the AI can choose from, call `registerComponent(name, component)` with each, where `name` is a unique name for the component.

```typescript
import Hydra from "hydra-ai";
import { FC } from "react";

export const initHydra = (openAIKey: string) => {
  const hydra = new Hydra(openAIKey);

  const TestComp: FC<{}> = () => {
    return <div>Test</div>;
  };

  const TestComp2: FC = () => {
    return <div>Test2</div>;
  };

  hydra.registerComponent("testComp", TestComp);
  hydra.registerComponent("testComp2", TestComp2);
  return hydra;
};
```

3. **Generate components**

```typescript
const component = await hydra.generateComponent(message);
```

You will likely want to have a state variable to hold the generated component. Here's a full example page (using NextJS) that uses Hydra:

```typescript
"use client";

import { ReactElement, useEffect, useState } from "react";
import { initHydra } from "./hydra";

export default function Home() {
  const [dynamicComponent, setDynamicComponent] = useState<ReactElement | null>(
    null
  );

  const hydra = initHydra(process.env.NEXT_PUBLIC_OPEN_AI_KEY!);

  const fetchComponent = async (message: string) => {
    const component = await hydra.generateComponent(message);
    setDynamicComponent(component);
  };

  useEffect(() => {
    fetchComponent("please show me testComp2");
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {dynamicComponent}
    </main>
  );
}
```
