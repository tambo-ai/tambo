import { createPromptTemplate } from "@tambo-ai-cloud/core";
import { AvailableComponents } from "../model/component-metadata";

function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

export function generateAvailableComponentsList(
  availableComponents: AvailableComponents,
): string {
  return Object.values(availableComponents)
    .map((component) => {
      let propsStr = "";
      if (component.props && Object.keys(component.props).length > 0) {
        const propsWithDetails = Object.entries(component.props)
          .map(([propName, propInfo]) => {
            let typeStr = "";
            let description = "";
            let required = false;

            if (typeof propInfo === "string") {
              typeStr = propInfo;
            } else if (typeof propInfo === "object" && propInfo !== null) {
              if ("type" in propInfo) {
                typeStr = String(propInfo.type);
              }

              if ("description" in propInfo) {
                description = String(propInfo.description);
              }

              if ("required" in propInfo) {
                required = Boolean(propInfo.required);
              }
            }
            let propStr = `${propName}: ${typeStr}`;

            if (required) {
              propStr += " (required)";
            }

            if (description) {
              propStr += ` - ${description}`;
            }

            return propStr;
          })
          .join(", ");

        propsStr = ` (Props: ${propsWithDetails})`;
      }

      return `- ${component.name}: ${component.description}${propsStr}`;
    })
    .join("\n");
}

export function getAvailableComponentsPromptTemplate(
  availableComponents: AvailableComponents,
) {
  const availableComponentsStr =
    Object.keys(availableComponents).length > 0
      ? generateAvailableComponentsList(availableComponents)
      : "No components available, do not try and generate a component.";
  return createPromptTemplate(
    `You may use only the following components:
{availableComponents}`,
    { availableComponents: availableComponentsStr },
  );
}

export function generateAvailableComponentsPrompt(
  availableComponents: AvailableComponents,
): string {
  const template = getAvailableComponentsPromptTemplate(availableComponents);
  return replaceTemplateVariables(template.template, template.args);
}
