import { DateTime } from "luxon";

export const getDefaultContextAdditions = (): string[] => {
  return [
    `The current iso timestamp is: ${DateTime.now().toISO()}, which includes the user's timezone.`,
  ];
};

export const updateMessageWithContextAdditions = (message: string): string => {
  const contextAdditions = getDefaultContextAdditions();
  return `${message}\n\n<System>This is additional information you can use to make a decision. This data is not provided by the user, but by the internal system: \n${contextAdditions.join(
    "\n"
  )}</System>`;
};
