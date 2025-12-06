import { MessageRole, ThreadMessage } from "@tambo-ai-cloud/core";
import {
  AvailableComponent,
  AvailableComponents,
} from "../model/component-metadata";
import { getAvailableComponentsPromptTemplate } from "./component-formatting";

/**
 * @param components List of available components
 * @param messages Array of thread messages to provide context
 * @param suggestionCount Number of suggestions to generate
 * @returns Array of system and user messages
 */
export function buildSuggestionPrompt(
  components: AvailableComponent[],
  messages: ThreadMessage[] = [],
  suggestionCount: number,
): Array<{ role: MessageRole; content: string }> {
  // Get current component if available
  let currentComponent: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentProps: any | null = null;

  if (messages.length > 0) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.component?.componentName) {
        currentComponent = msg.component.componentName;
        currentProps = msg.component.props || null;
        break;
      }
    }
  }

  // Convert components array to AvailableComponents object format
  const availableComponentsObj: AvailableComponents = {};
  components.forEach((component) => {
    availableComponentsObj[component.name] = component;
  });

  // Use getAvailableComponentsPromptTemplate to generate the component list
  const availableComponentsTemplate = getAvailableComponentsPromptTemplate(
    availableComponentsObj,
  );
  const componentList = availableComponentsTemplate.template
    .replace(
      "{availableComponents}",
      availableComponentsTemplate.args.availableComponents,
    )
    .trim();

  const systemMessage = `Review the available components and conversation history to generate natural follow-up messages that a user might send.

${componentList}

LANGUAGE REQUIREMENT:
- Detect the language used by the user in their messages
- ALL suggestions (both title and detailedSuggestion) MUST be written in the same language as the user's messages
- If no user messages exist or the language is unclear, DEFAULT TO ENGLISH
- Only use a non-English language if the user has clearly written in that language

Your task is to suggest ${suggestionCount} messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

Rules:
1. Write each suggestion as a complete message that could be sent by the user
2. Focus on practical requests that use the available components
3. Make suggestions contextually relevant to the conversation and previous actions
4. If a component is currently in use, suggest natural variations or new ways to use it
5. Write in a natural, conversational tone as if the user is typing
6. Avoid technical language or system-focused phrasing`;

  // Build the result array starting with the system message
  const result: Array<{
    role: MessageRole;
    content: string;
  }> = [{ role: MessageRole.System, content: systemMessage }];

  // Add recent conversation history as separate messages
  // Include more messages to help with language detection (up to 5 messages)
  if (messages.length > 0) {
    const recentMessages = messages
      .filter(
        (m) => m.role === MessageRole.User || m.role === MessageRole.Assistant,
      )
      .slice(-5);

    recentMessages.forEach((msg) => {
      const content = msg.content
        .map((c) => ("text" in c ? c.text : ""))
        .join("");
      if (content.trim()) {
        result.push({ role: msg.role, content });
      }
    });
  }

  // Add current component context if available
  const componentContext = currentComponent
    ? `Current component: ${currentComponent}\nCurrent props: ${JSON.stringify(currentProps, null, 2)}`
    : "No component currently in use.";

  // Add the final user message with the request
  const finalUserMessage = `Generate ${suggestionCount} natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.

IMPORTANT: Write suggestions in the same language as the user's messages above. If no user messages exist or the language is unclear, use English.

${componentContext}`;

  result.push({ role: MessageRole.User, content: finalUserMessage });

  return result;
}
