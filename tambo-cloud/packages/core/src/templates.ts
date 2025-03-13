/**
 * Type helper to extract parameter names from template strings
 * @param T - The template string, e.g. "Hello, {name}!"
 * @returns A type that represents the parameter names in the template string
 */
type ExtractParams<T extends string> =
  T extends `${infer _Pre}{${infer Param}}${infer Post}`
    ? Param | ExtractParams<Post>
    : never;

/**
 * A prompt template with type inference, enforcing that the template string variables
 * are used in the args object.
 * @param T - The template string, e.g. "Hello, {name}!"
 * @param args - The arguments to be substituted into the template, e.g. { name: "John" }
 * @returns A PromptTemplate object with type inference
 */
export interface PromptTemplate<T extends string> {
  template: T;
  args: Record<ExtractParams<T>, string>;
}
/**
 * Creates a prompt template with type inference, enforcing that the template string variables
 * are used in the args object.
 *
 * @example
 * ```ts
 * const prompt = createPromptTemplate("Hello, {name}!", { name: "John" });
 * ```
 * This will ensure that the template string is used correctly and that the arguments are
 * specified. For example, this will throw a type error:
 * ```ts
 * const prompt = createPromptTemplate("Hello, {name}!", { age: "30" });
 * // Error: Object literal may only specify known properties, and 'age' does not exist in type 'Record<"name", string>'.

 * ```
 * @param template - The template string, e.g. "Hello, {name}!"
 * @param args - The arguments to be substituted into the template, e.g. { name: "John" }
 * @returns A PromptTemplate object with type inference
 */
export function createPromptTemplate<T extends string>(
  template: T,
  args: Record<ExtractParams<T>, string>,
): PromptTemplate<T> {
  return { template, args };
}
