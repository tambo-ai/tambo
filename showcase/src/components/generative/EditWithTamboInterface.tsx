import { EditWithTamboButton } from "@tambo-ai/ui-registry/components/edit-with-tambo-button";
import { MessageThreadCollapsible } from "@tambo-ai/ui-registry/components/message-thread-collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { withInteractable } from "@tambo-ai/react";
import { useCallback, useState } from "react";
import { z } from "zod";

// Schema for the contact form (only editable props)
const ContactFormPropsSchema = z.object({
  title: z.string().describe("Form heading"),
  description: z.string().describe("Form description"),
  nameLabel: z.string().describe("Label for name field"),
  nameValue: z.string().describe("Default value for name field"),
  emailLabel: z.string().describe("Label for email field"),
  emailValue: z.string().describe("Default value for email field"),
  selectLabel: z.string().describe("Label for dropdown selector field"),
  selectOptions: z
    .array(z.string())
    .describe("Options for the dropdown selector"),
  selectValue: z
    .string()
    .describe(
      "Default selected value for dropdown (must be one of the options)",
    ),
  messageLabel: z.string().describe("Label for message field"),
  messageValue: z.string().describe("Default value for message field"),
  submitText: z.string().describe("Submit button text"),
});

// Props interface
interface ContactFormProps {
  title: string;
  description: string;
  nameLabel: string;
  nameValue: string;
  emailLabel: string;
  emailValue: string;
  selectLabel: string;
  selectOptions: string[];
  selectValue: string;
  messageLabel: string;
  messageValue: string;
  submitText: string;
  onOpenThread?: () => void;
}

// Base form component
function ContactFormBase({
  title,
  description,
  nameLabel,
  nameValue,
  emailLabel,
  emailValue,
  selectLabel,
  selectOptions,
  selectValue,
  messageLabel,
  messageValue,
  submitText,
  onOpenThread,
}: ContactFormProps) {
  // Ensure selectValue is one of the valid options, fallback to first option
  const safeSelectValue = selectOptions.includes(selectValue)
    ? selectValue
    : (selectOptions[0] ?? "");

  return (
    <div className="w-full rounded-lg border border-border bg-background shadow-lg">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-2 md:gap-4">
          <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="shrink-0">
            <EditWithTamboButton
              tooltip="Edit form"
              description="Edit the form labels and content"
              onOpenThread={onOpenThread}
            />
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {nameLabel}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              defaultValue={nameValue}
              placeholder="John Doe"
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent focus:border-input transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {emailLabel}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="email"
              defaultValue={emailValue}
              placeholder="john@example.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent focus:border-input transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {selectLabel}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Select defaultValue={safeSelectValue} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {messageLabel}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              defaultValue={messageValue}
              placeholder="Tell us how we can help..."
              rows={4}
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent focus:border-input transition-colors resize-y"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 focus:ring-2 focus:ring-accent font-medium transition-colors"
          >
            {submitText}
          </button>
        </form>
      </div>
    </div>
  );
}

// Interactable wrapped component
const ContactForm = withInteractable(ContactFormBase, {
  componentName: "ContactForm",
  description:
    "A contact form with editable labels and text. You can modify the form heading, field labels, and button text.",
  propsSchema: ContactFormPropsSchema,
});

export const EditWithTamboInterface = () => {
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  // Handler to open the thread panel
  const handleOpenThread = useCallback(() => {
    // Simulate Cmd+K to open the collapsible (hook checks for metaKey OR ctrlKey)
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    setIsThreadOpen(true);
  }, []);

  return (
    <div className="relative flex flex-col gap-6 p-4 md:p-8 min-h-[700px]">
      {/* Interactable components */}
      <div className="space-y-4 max-w-2xl mx-auto w-full">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Interactive Demo</h3>
          <p className="text-sm text-muted-foreground">
            Click the AI/Bot button on the form to edit it using natural
            language. Try instructions like &quot;Make the form more
            professional&quot;, &quot;Change the prefilled values&quot;,
            &quot;Change the dropdown options&quot;, or &quot;Change to a
            support form&quot;. Use &quot;Send in Thread&quot; to open the
            collapsible chat panel with suggestions.
          </p>
        </div>

        <ContactForm
          title="Get in Touch"
          description="We'd love to hear from you. Fill out the form below."
          nameLabel="Full Name"
          nameValue="Jane Smith"
          emailLabel="Email Address"
          emailValue="jane.smith@example.com"
          selectLabel="How did you hear about us?"
          selectOptions={[
            "Search Engine",
            "Social Media",
            "Friend or Colleague",
            "Advertisement",
            "Other",
          ]}
          selectValue="Social Media"
          messageLabel="Your Message"
          messageValue="I'm interested in learning more about your services."
          submitText="Send Message"
          onOpenThread={handleOpenThread}
        />
      </div>

      {/* Collapsible message thread */}
      <MessageThreadCollapsible defaultOpen={isThreadOpen} className="z-60" />
    </div>
  );
};
