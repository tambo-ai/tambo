import TamboAI from "@tambo-ai/typescript-sdk";
import { parse } from "partial-json";
import { h } from "vue";
import { z } from "zod";
import { wrapWithTamboMessageProvider } from "../composables/use-current-message";
import { ComponentRegistry } from "../model/component-metadata";
import { TamboThreadMessage } from "../model/generate-component-response";
import { getComponentFromRegistry } from "../util/registry";

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

  const validatedProps =
    (registeredComponent.props as any) instanceof z.ZodType
      ? (registeredComponent.props as any).parse(parsedProps)
      : parsedProps;

  const renderedComponent = h(registeredComponent.component as any, validatedProps);
  const fullMessage: TamboThreadMessage = {
    ...message,
    component: {
      ...message.component,
      props: validatedProps,
    } as any,
  };
  const wrapped = wrapWithTamboMessageProvider(renderedComponent, fullMessage);
  return { ...fullMessage, renderedComponent: wrapped };
}

