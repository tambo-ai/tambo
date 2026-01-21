/** Migrated from libretto: https://github.com/libretto-ai/openai-ts/blob/main/src/template.ts  */
// we only support the simplest of template expressions

import { ThreadMessage } from "@tambo-ai-cloud/core";

/** Match a full template expression, e.g. '{foo}' in 'replace {foo} now' */
const templateExpression = /({[a-zA-Z0-9_[\].]+})/g;
/** Match the variable inside a template expression, e.g. the 'foo' in 'replace {foo} now' */
const templateExpressionVarName = /{([a-zA-Z0-9_[\].]+)}/g;
/** Unescape variable names, e.g. if the template originally contained `\{foo\}`
 * to avoid substitutions, then replace it again with `{foo}` */
const unescapeVariableExpression = /\\{([a-zA-Z0-9_[\].]+)\\}/g;
// We have a special keyword that we use to expand out an array for a chat_history argument

type primitive = string | number | boolean | null | undefined;

/**
 * A recursive type representing an object that can be templated.
 */
export type TemplateValue =
  | primitive
  | { [key: string]: TemplateValue }
  | TemplateValue[];

/**
 * Parameters passed to format a template.
 */
export type TemplateParameters = Record<
  string,
  string | ThreadMessage[] | undefined
>;
/**
 * An alternative to template literals that allows for capturing the name of the
 * variables involved, and doing variable substitution at a later time.
 *
 * This is used for prompts where you want the same prompt but swap out certain values.
 *
 * Example:
 *
 * ```
 * const template = f`Hello {name}!`;
 *
 * // exposes the following:
 * template.variables; // ["name"]
 * template[formatProp]({name: "World"}); // "Hello World!"
 * template[templateProp]; // "Hello {name}!"
 * ```
 *
 *
 * @param strings The string parts passed to the template literal
 * @returns An object with the following properties:
 * - `variables`: The names of the variables used in the template
 * - `format`: A function that takes a dictionary of variable names to values, and returns the formatted string
 * - `template`: The original template string
 * @throws If the template literal contains any inline variables (e.g. `${name}` instead of `{name}`)
 */
export function f(
  strings: TemplateStringsArray | string,
  ...inlineVariables: primitive[]
) {
  if (inlineVariables.length > 0) {
    throw new Error("No inline variables: Use {} syntax, instead of ${}");
  }
  const strArray = typeof strings == "string" ? [strings] : strings;
  const str = strArray.join("");

  const variables = Array.from(
    new Set(
      str
        .split(templateExpression)
        .map(
          (s) =>
            // extract the variable name from the template expression
            templateExpressionVarName.exec(s)?.[1],
        )
        .filter((s): s is string => !!s),
    ),
  );
  return {
    [formatProp]: (parameters: TemplateParameters) => {
      return str
        .replace(templateExpressionVarName, (match, variableName) => {
          if (parameters[variableName] === undefined) {
            throw new Error(
              `Can't format template, missing variable: ${variableName}`,
            );
          }
          return parameters[variableName] as string;
        })
        .replace(
          unescapeVariableExpression,
          (_match, variableName) => `{${variableName}}`,
        );
    },
    [variablesProp]: Object.freeze(variables),
    [templateProp]: str,
  };
}

const formatProp = Symbol("format");

const templateProp = Symbol("template");

const variablesProp = Symbol("variables");

export function formatTemplate<T>(
  o: ObjectTemplate<T>,
  parameters: TemplateParameters,
): T {
  const format = o[formatProp];
  return format(parameters);
}

export function getTemplate<T>(o: ObjectTemplate<T>): T {
  return o[templateProp];
}

export function getTemplateVariables<T>(
  o: ObjectTemplate<T>,
): readonly string[] {
  return o[variablesProp];
}

/**
 * A template for nested objects, most useful when constructing chat prompts.
 */
export interface ObjectTemplate_<T> {
  /**
   * A function that takes a dictionary of variable names to values, and returns the formatted object
   */
  [formatProp]: (parameters: TemplateParameters) => T;
  /**
   * The names of the variables used in the template
   */
  [variablesProp]: readonly string[];
  /**
   * The original template object
   */
  [templateProp]: T;
}

export type ObjectTemplate<T> = T extends string
  ? ObjectTemplate_<T>
  : ObjectTemplate_<T> & T;
/**
 * A template for nested objects, most useful when constructing chat prompts.
 *
 * Example:
 *
 * ```
 * const template = objectTemplate([{
 *   "role": "user",
 *   "content": f`Hello {name}!`
 * }]);
 *
 * // exposes the following:
 * template[variablesProp]; // ["name"]
 * template[formatProp]({name: "World"}); // [{role: "user", content: "Hello World!"}]
 * template[templateProp]; // [{role: "user", content: "Hello {name}!"}]
 * ```
 *
 * @param objs The object to template
 * @returns An object with the following properties:
 * - `variables`: The names of the variables used in the template
 * - `format`: A function that takes a dictionary of variable names to values, and returns the formatted object
 * - `template`: The original template object
 * @throws If the template literal contains any inline variables (e.g. `${name}` instead of `{name}`)
 */
export function objectTemplate<T>(objs: T): ObjectTemplate<T> {
  const variables = objTemplateVariables(objs);

  function format(parameters: TemplateParameters): T {
    if (objs === undefined || objs === null || typeof objs == "number") {
      return objs;
    }
    if (typeof objs == "string") {
      return f(objs)[formatProp](parameters) as T;
    }
    if (Array.isArray(objs)) {
      return objs.flatMap((item) => {
        return objectTemplate(item)[formatProp](parameters);
      }) as T;
    }

    return Object.fromEntries(
      Object.entries(objs).map(([key, value]) => {
        return [
          f(key)[formatProp](parameters),
          objectTemplate(value)[formatProp](parameters),
        ];
      }),
    ) as T;
  }
  if (typeof objs == "string") {
    return {
      [formatProp]: format,
      [variablesProp]: variables,
      [templateProp]: objs,
      toString: () => objs,
    } as ObjectTemplate<T>;
  }
  if (typeof objs !== "object") {
    throw new Error(
      "Can only generate object templates for objects or strings",
    );
  }
  const result = structuredClone(objs) as ObjectTemplate<T>;
  result[formatProp] = format;
  result[variablesProp] = Object.freeze(variables);
  result[templateProp] = objs;
  return result;
}

function objTemplateVariables(objs: unknown): readonly string[] {
  if (objs === undefined || objs === null || typeof objs == "number") {
    return [];
  }
  if (typeof objs == "string") {
    return f(objs)[variablesProp];
  }

  if (Array.isArray(objs)) {
    return objs.flatMap((item) => objTemplateVariables(item));
  }
  return Object.entries(objs as Record<string, unknown>).flatMap(
    ([, value]): readonly string[] => {
      if (typeof value == "string") {
        return f(value)[variablesProp];
      }
      return objTemplateVariables(value);
    },
  );
}
