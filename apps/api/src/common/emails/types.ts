/**
 * An email with a subject and a body.
 */
export interface Email<T = Record<string, unknown>> {
  subject: string;
  html: (variables: T) => string;
  text?: (variables: T) => string;
}

/**
 * The variables for the welcome email.
 */
export interface WelcomeEmailVariables {
  firstName?: string | null;
}

/**
 * The variables for the message limit email.
 */
export interface MessageLimitEmailVariables {
  projectId: string;
  projectName: string;
  messageLimit: number;
}

/**
 * The variables for the first message email.
 */
export interface FirstMessageEmailVariables {
  firstName?: string | null;
  projectName: string;
}
