import { DateTime } from "luxon";

export const getDefaultContextAdditions = (): string[] => {
  return [
    `The current iso timestamp is: ${DateTime.now().toISO()}, which includes the user's timezone.`,
  ];
};

export const updateMessageWithContextAdditions = (message: string): string => {
  const contextAdditions = getDefaultContextAdditions();
  return `${message}\n\n${contextAdditions.join("\n")}`;
};
