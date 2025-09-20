import TamboAI from "@tambo-ai/typescript-sdk";
import { parse } from "partial-json";
import { h, VNode } from "vue";
import { TamboThreadMessage } from "../model/generate-component-response";
import { ComponentRegistry } from "../model/component-metadata";
import { getComponentFromRegistry } from "./registry";

export function renderComponentIntoMessage(
  message: TamboAI.Beta.Threads.ThreadMessage,
  componentList: ComponentRegistry,
): TamboThreadMessage {
  if (!message.component?.componentName) {
    throw new Error("Component not found");
    }
  const parsedProps = parse(JSON.stringify(message.component.props));
  const registeredComponent = getComponentFromRegistry(
    message.component.componentName,
    componentList,
  );

  const validatedProps = (registeredComponent.props as any)?._def &&
    typeof (registeredComponent.props as any).parse === "function"
    ? (registeredComponent.props as any).parse(parsedProps)
    : parsedProps;

  const renderedComponent: VNode = h(registeredComponent.component as any, validatedProps);

  const fullMessage: TamboThreadMessage = {
    ...message,
    component: {
      ...message.component,
      props: validatedProps,
    },
  } as any;

  return {
    ...fullMessage,
    renderedComponent,
  };
}

