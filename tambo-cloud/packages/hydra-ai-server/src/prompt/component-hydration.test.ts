import { z } from "zod";
import { AvailableComponents } from "../model/component-metadata";
import { getComponentHydrationPromptTemplate } from "./component-hydration";

describe("getComponentHydrationPromptTemplate", () => {
  const mockAvailableComponentsWithZod: AvailableComponents = {
    TestComponent: {
      name: "TestComponent",
      description: "A test component",
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      contextTools: [],
    },
  };

  const mockToolResponse = {
    data: {
      result: "test result",
    },
    type: "test",
  };

  describe("v1", () => {
    it("should generate prompt template without tool response", () => {
      const result = getComponentHydrationPromptTemplate(
        undefined,
        mockAvailableComponentsWithZod,
        "v1",
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "args": {
            "availableComponentsPrompt": "You may use only the following components:

        - componentName: "TestComponent":
            description: A test component
            props:
            {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                }
              },
              "required": [
                "title"
              ],
              "additionalProperties": false,
              "$schema": "http://json-schema.org/draft-07/schema#"
            }
        ",
            "zodTypePrompt": "
              Return a JSON object that matches the given Zod schema.
              If a field is Optional and there is no input don't include in the JSON response.
              Only use tailwind classes where it explicitly says to use them.
              You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

            "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
            For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
            would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
            Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

            Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

            Here is the JSON Schema instance your output must adhere to. Only return valid JSON Schema.
            \`\`\`json
            {
          "type": "object",
          "properties": {
            "message": {
              "type": "string",
              "description": "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does."
            },
            "componentName": {
              "type": "string",
              "description": "The name of the chosen component"
            },
            "reasoning": {
              "type": "string",
              "description": "The reasoning behind the decision"
            },
            "componentState": {
              "type": "object",
              "additionalProperties": {},
              "description": "Any additional state properties that should be injected into the component, \\nused to carry state forward from previous component decisions."
            },
            "props": {
              "type": "object",
              "additionalProperties": {},
              "description": "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)"
            },
            "suggestedActions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string",
                    "description": "The text to show for this action in a button. This should be a short, concise label that would be used in a button, and should describe what the action does."
                  },
                  "actionText": {
                    "type": "string",
                    "description": "The exact text that will be sent to the AI on the user's behalf when they select this action."
                  }
                },
                "required": [
                  "label",
                  "actionText"
                ],
                "additionalProperties": false
              },
              "maxItems": 3,
              "description": "Up to 3 suggested next actions that would make sense given the current context. Only include if relevant."
            }
          },
          "required": [
            "message",
            "componentName",
            "reasoning",
            "props"
          ],
          "additionalProperties": false,
          "$schema": "http://json-schema.org/draft-07/schema#"
        }
            \`\`\`
            
            ",
          },
          "template": "You are an AI assistant that interacts with users and helps them perform tasks.
        To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. 

        When prompted, you will be given the existing conversation history, followed by the component to display, 
        its description provided by the user, the shape of any props to pass in, and any other related context.

        Use the conversation history and other provided context to determine what props to pass in.
        Certain messages in the conversation history may contain a component decision, which is a component that has been shown to the user.
        That component has a few important properties:
        - componentName: The name of the component
        - props: The props that were passed in to the component
        - componentState: The internal state of the component (sort of like uses ofuseState in react)
        - suggestedActions: Any suggested actions that the user can take

        When possible, carry the componentState forward from the last component decision into the next component decision.

        This response should be short and concise.

        When generating suggestedActions, consider the following:
        1. Each suggestion should be a natural follow-up action that would make use of an available components
        2. The actionText should be phrased as a user message that would trigger the use of a specific component
        3. Suggestions should be contextually relevant to what the user is trying to accomplish
        4. Include 1-3 suggestions that would help the user progress in their current task
        5. The label should be a clear, concise button text, while the actionText can be more detailed
        You can also use any of the provided tools to fetch data needed to pass into the component.

        {availableComponentsPrompt}

        {zodTypePrompt}",
        }
      `);
    });

    it("should generate prompt template with tool response", () => {
      const result = getComponentHydrationPromptTemplate(
        mockToolResponse,
        mockAvailableComponentsWithZod,
        "v1",
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "args": {
            "availableComponentsPrompt": "You may use only the following components:

        - componentName: "TestComponent":
            description: A test component
            props:
            {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                }
              },
              "required": [
                "title"
              ],
              "additionalProperties": false,
              "$schema": "http://json-schema.org/draft-07/schema#"
            }
        ",
            "toolResponseString": "{"data":{"result":"test result"},"type":"test"}",
            "zodTypePrompt": "
              Return a JSON object that matches the given Zod schema.
              If a field is Optional and there is no input don't include in the JSON response.
              Only use tailwind classes where it explicitly says to use them.
              You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

            "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
            For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
            would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
            Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

            Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

            Here is the JSON Schema instance your output must adhere to. Only return valid JSON Schema.
            \`\`\`json
            {
          "type": "object",
          "properties": {
            "message": {
              "type": "string",
              "description": "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does."
            },
            "componentName": {
              "type": "string",
              "description": "The name of the chosen component"
            },
            "reasoning": {
              "type": "string",
              "description": "The reasoning behind the decision"
            },
            "componentState": {
              "type": "object",
              "additionalProperties": {},
              "description": "Any additional state properties that should be injected into the component, \\nused to carry state forward from previous component decisions."
            },
            "props": {
              "type": "object",
              "additionalProperties": {},
              "description": "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)"
            },
            "suggestedActions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string",
                    "description": "The text to show for this action in a button. This should be a short, concise label that would be used in a button, and should describe what the action does."
                  },
                  "actionText": {
                    "type": "string",
                    "description": "The exact text that will be sent to the AI on the user's behalf when they select this action."
                  }
                },
                "required": [
                  "label",
                  "actionText"
                ],
                "additionalProperties": false
              },
              "maxItems": 3,
              "description": "Up to 3 suggested next actions that would make sense given the current context. Only include if relevant."
            }
          },
          "required": [
            "message",
            "componentName",
            "reasoning",
            "props"
          ],
          "additionalProperties": false,
          "$schema": "http://json-schema.org/draft-07/schema#"
        }
            \`\`\`
            
            ",
          },
          "template": "You are an AI assistant that interacts with users and helps them perform tasks.
        To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. 

        When prompted, you will be given the existing conversation history, followed by the component to display, 
        its description provided by the user, the shape of any props to pass in, and any other related context.

        Use the conversation history and other provided context to determine what props to pass in.
        Certain messages in the conversation history may contain a component decision, which is a component that has been shown to the user.
        That component has a few important properties:
        - componentName: The name of the component
        - props: The props that were passed in to the component
        - componentState: The internal state of the component (sort of like uses ofuseState in react)
        - suggestedActions: Any suggested actions that the user can take

        When possible, carry the componentState forward from the last component decision into the next component decision.

        This response should be short and concise.

        When generating suggestedActions, consider the following:
        1. Each suggestion should be a natural follow-up action that would make use of an available components
        2. The actionText should be phrased as a user message that would trigger the use of a specific component
        3. Suggestions should be contextually relevant to what the user is trying to accomplish
        4. Include 1-3 suggestions that would help the user progress in their current task
        5. The label should be a clear, concise button text, while the actionText can be more detailed
        You have received a response from a tool. Use this data to help determine what props to pass in: {toolResponseString}

        {availableComponentsPrompt}

        {zodTypePrompt}",
        }
      `);
    });
  });

  describe("v2", () => {
    it("should generate prompt template without tool response", () => {
      const result = getComponentHydrationPromptTemplate(
        undefined,
        mockAvailableComponentsWithZod,
        "v2",
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "args": {
            "availableComponentsPrompt": "You may use only the following components:

        - componentName: "TestComponent":
            description: A test component
            props:
            {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                }
              },
              "required": [
                "title"
              ],
              "additionalProperties": false,
              "$schema": "http://json-schema.org/draft-07/schema#"
            }
        ",
            "zodTypePrompt": "
              Return a JSON object that matches the given Zod schema.
              If a field is Optional and there is no input don't include in the JSON response.
              Only use tailwind classes where it explicitly says to use them.
              You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

            "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
            For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
            would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
            Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

            Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

            Here is the JSON Schema instance your output must adhere to. Only return valid JSON Schema.
            \`\`\`json
            {
          "type": "object",
          "properties": {
            "message": {
              "type": "string",
              "description": "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does."
            },
            "componentName": {
              "type": "string",
              "description": "The name of the chosen component"
            },
            "reasoning": {
              "type": "string",
              "description": "The reasoning behind the decision"
            },
            "componentState": {
              "type": "object",
              "additionalProperties": {},
              "description": "Any additional state properties that should be injected into the component, \\nused to carry state forward from previous component decisions."
            },
            "props": {
              "type": "object",
              "additionalProperties": {},
              "description": "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)"
            }
          },
          "required": [
            "message",
            "componentName",
            "reasoning",
            "props"
          ],
          "additionalProperties": false,
          "$schema": "http://json-schema.org/draft-07/schema#"
        }
            \`\`\`
            
            ",
          },
          "template": "You are an AI assistant that interacts with users and helps them perform tasks.
        To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. 

        When prompted, you will be given the existing conversation history, followed by the component to display, 
        its description provided by the user, the shape of any props to pass in, and any other related context.

        Use the conversation history and other provided context to determine what props to pass in.
        Certain messages in the conversation history may contain a component decision, which is a component that has been shown to the user.
        That component has a few important properties:
        - componentName: The name of the component
        - props: The props that were passed in to the component
        - componentState: The internal state of the component (sort of like uses ofuseState in react)
        - suggestedActions: Any suggested actions that the user can take

        When possible, carry the componentState forward from the last component decision into the next component decision.

        This response should be short and concise.

        You can also use any of the provided tools to fetch data needed to pass into the component.

        {availableComponentsPrompt}

        {zodTypePrompt}",
        }
      `);
    });

    it("should generate prompt template with tool response", () => {
      const result = getComponentHydrationPromptTemplate(
        mockToolResponse,
        mockAvailableComponentsWithZod,
        "v2",
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "args": {
            "availableComponentsPrompt": "You may use only the following components:

        - componentName: "TestComponent":
            description: A test component
            props:
            {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                }
              },
              "required": [
                "title"
              ],
              "additionalProperties": false,
              "$schema": "http://json-schema.org/draft-07/schema#"
            }
        ",
            "toolResponseString": "{"data":{"result":"test result"},"type":"test"}",
            "zodTypePrompt": "
              Return a JSON object that matches the given Zod schema.
              If a field is Optional and there is no input don't include in the JSON response.
              Only use tailwind classes where it explicitly says to use them.
              You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

            "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.
            For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}}}
            would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
            Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

            Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

            Here is the JSON Schema instance your output must adhere to. Only return valid JSON Schema.
            \`\`\`json
            {
          "type": "object",
          "properties": {
            "message": {
              "type": "string",
              "description": "The message to be displayed to the user alongside the chosen component. Depending on the component type, and the user message, this message might include a description of why a given component was chosen, and what can be seen within it, or what it does."
            },
            "componentName": {
              "type": "string",
              "description": "The name of the chosen component"
            },
            "reasoning": {
              "type": "string",
              "description": "The reasoning behind the decision"
            },
            "componentState": {
              "type": "object",
              "additionalProperties": {},
              "description": "Any additional state properties that should be injected into the component, \\nused to carry state forward from previous component decisions."
            },
            "props": {
              "type": "object",
              "additionalProperties": {},
              "description": "The props that should be used in the chosen component. These will be injected by using React.createElement(component, props)"
            }
          },
          "required": [
            "message",
            "componentName",
            "reasoning",
            "props"
          ],
          "additionalProperties": false,
          "$schema": "http://json-schema.org/draft-07/schema#"
        }
            \`\`\`
            
            ",
          },
          "template": "You are an AI assistant that interacts with users and helps them perform tasks.
        To help the user perform these tasks, you are able to generate UI components. You are able to display components and decide what props to pass in. 

        When prompted, you will be given the existing conversation history, followed by the component to display, 
        its description provided by the user, the shape of any props to pass in, and any other related context.

        Use the conversation history and other provided context to determine what props to pass in.
        Certain messages in the conversation history may contain a component decision, which is a component that has been shown to the user.
        That component has a few important properties:
        - componentName: The name of the component
        - props: The props that were passed in to the component
        - componentState: The internal state of the component (sort of like uses ofuseState in react)
        - suggestedActions: Any suggested actions that the user can take

        When possible, carry the componentState forward from the last component decision into the next component decision.

        This response should be short and concise.

        You have received a response from a tool. Use this data to help determine what props to pass in: {toolResponseString}

        {availableComponentsPrompt}

        {zodTypePrompt}",
        }
      `);
    });
  });
});
