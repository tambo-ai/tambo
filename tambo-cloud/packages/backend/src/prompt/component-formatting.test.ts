import { AvailableComponents } from "../model/component-metadata";
import {
  generateAvailableComponentsList,
  generateAvailableComponentsPrompt,
} from "./component-formatting";

describe("component-formatting", () => {
  describe("generateAvailableComponentsList", () => {
    it("Should generate a proper result for zero components", () => {
      const components: AvailableComponents = {};
      const result = generateAvailableComponentsList(components);
      expect(result).toMatchInlineSnapshot(`
        "
        "
      `);
    });

    it("should generate list with simple components", () => {
      const components: AvailableComponents = {
        Button: {
          name: "Button",
          description: "A simple button component",
          props: {
            label: "string",
          },
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsList(components);
      expect(result).toMatchInlineSnapshot(`
        "
        - componentName: "Button":
            description: A simple button component
            props:
            {
              "label": "string"
            }
        "
      `);
    });

    it("should handle components with no props", () => {
      const components: AvailableComponents = {
        Divider: {
          name: "Divider",
          description: "A horizontal divider",
          props: {},
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsList(components);
      expect(result).toMatchInlineSnapshot(`
        "
        - componentName: "Divider":
            description: A horizontal divider
            props:

        "
      `);
    });

    it("should handle components with complex props", () => {
      const components: AvailableComponents = {
        Input: {
          name: "Input",
          description: "An input field",
          props: {
            value: {
              type: "string",
              description: "The input value",
              required: true,
            },
            onChange: {
              type: "(value: string) => void",
              description: "Change handler",
              required: true,
            },
          },
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsList(components);
      expect(result).toMatchInlineSnapshot(`
        "
        - componentName: "Input":
            description: An input field
            props:
            {
              "value": {
                "type": "string",
                "description": "The input value",
                "required": true
              },
              "onChange": {
                "type": "(value: string) => void",
                "description": "Change handler",
                "required": true
              }
            }
        "
      `);
    });

    it("should handle multiple components", () => {
      const components: AvailableComponents = {
        Button: {
          name: "Button",
          description: "A button",
          props: { label: "string" },
          contextTools: [],
        },
        Text: {
          name: "Text",
          description: "A text component",
          props: {},
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsList(components);
      expect(result).toMatchInlineSnapshot(`
        "
        - componentName: "Button":
            description: A button
            props:
            {
              "label": "string"
            }

        - componentName: "Text":
            description: A text component
            props:

        "
      `);
    });
  });

  describe("generateAvailableComponentsPrompt", () => {
    it("should generate prompt with components", () => {
      const components: AvailableComponents = {
        Button: {
          name: "Button",
          description: "A button component",
          props: { label: "string" },
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsPrompt(components);
      expect(result).toMatchInlineSnapshot(`
        "You may use only the following components:

        - componentName: "Button":
            description: A button component
            props:
            {
              "label": "string"
            }
        "
      `);
    });

    it("should handle empty components", () => {
      const components: AvailableComponents = {};

      const result = generateAvailableComponentsPrompt(components);
      expect(result).toMatchInlineSnapshot(`
        "You may use only the following components:
        No components available, do not try and generate a component."
      `);
    });

    it("should handle required components", () => {
      const components: AvailableComponents = {
        Input: {
          name: "Input",
          description: "An input field",
          props: {
            value: {
              type: "string",
              required: true,
            },
          },
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsPrompt(components);
      expect(result).toMatchInlineSnapshot(`
        "You may use only the following components:

        - componentName: "Input":
            description: An input field
            props:
            {
              "value": {
                "type": "string",
                "required": true
              }
            }
        "
      `);
    });

    it("should handle props with descsription", () => {
      const components: AvailableComponents = {
        Input: {
          name: "Input",
          description: "An input field",
          props: {
            value: {
              type: "string",
              description: "The input value",
            },
          },
          contextTools: [],
        },
      };

      const result = generateAvailableComponentsPrompt(components);
      expect(result).toMatchInlineSnapshot(`
        "You may use only the following components:

        - componentName: "Input":
            description: An input field
            props:
            {
              "value": {
                "type": "string",
                "description": "The input value"
              }
            }
        "
      `);
    });
  });
});
