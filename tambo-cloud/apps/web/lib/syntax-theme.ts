import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * High contrast light syntax highlighting theme for TypeScript and React code
 * Optimized for maximum readability with enhanced contrast
 */
export const highContrastLightTheme: Record<string, any> = {
  ...materialLight,
  comment: {
    ...materialLight.comment,
    color: "#005299", // Darker blue with strong contrast against white
  },
  punctuation: {
    ...materialLight.punctuation,
    color: "#121212", // Nearly black for maximum contrast
  },
  keyword: {
    ...materialLight.keyword,
    color: "#c41030", // Deep red for strong visibility
  },
  string: {
    ...materialLight.string,
    color: "#097134", // Darker green for better contrast
  },
  function: {
    ...materialLight.function,
    color: "#5721b0", // Deep purple for clarity
  },
  variable: {
    ...materialLight.variable,
    color: "#953800", // Deeper orange for contrast
  },
  property: {
    ...materialLight.property,
    color: "#004095", // Strong blue for properties/JSON keys
  },
  operator: {
    ...materialLight.operator,
    color: "#121212", // Nearly black for operators like =, +, etc.
  },
  // TypeScript specific enhancements
  builtin: {
    ...materialLight.builtin,
    color: "#7a1fa0", // Deep purple for built-in types
  },
  "class-name": {
    ...materialLight.className,
    color: "#0059b3", // Deep blue for class names and interfaces
  },
  // React JSX enhancements
  tag: {
    ...materialLight.tag,
    color: "#0e6e34", // Darker green for JSX tags
  },
  "attr-value": {
    ...materialLight.string,
    color: "#097134", // Match string color
  },
  "attr-name": {
    ...materialLight.property,
    color: "#004095", // Deep blue for props
  },
  script: {
    ...materialLight.script,
    color: "#121212", // Nearly black for JSX expressions
  },
  // Enhanced TypeScript types
  generic: {
    color: "#6b21a8", // Purple for generics
  },
  number: {
    ...materialLight.number,
    color: "#ae2b00", // Dark red for numbers
  },
  boolean: {
    ...materialLight.boolean,
    color: "#ae2b00", // Match number color for booleans
  },
  // Fix for braces, brackets, object keys
  delimiter: {
    color: "#121212", // Nearly black for braces and brackets
  },
  objectivec: {
    color: "#121212", // For better object syntax
  },
  key: {
    color: "#004095", // Strong blue for object keys
  },
  definition: {
    color: "#0059b3", // Blue for variable definitions
  },
  namespace: {
    color: "#121212", // Black for namespaces
  },
  // Ensure imports appear correctly
  imports: {
    color: "#121212", // Nearly black for import statements
  },
  // Make constants and variable declarations more visible
  constant: {
    color: "#0059b3", // Strong blue for constants
  },
  parameter: {
    color: "#953800", // Deep orange for parameters
  },
  // Enhance equality operators and others
  "operator-equals": {
    color: "#121212", // Dark for equals signs
  },
};
