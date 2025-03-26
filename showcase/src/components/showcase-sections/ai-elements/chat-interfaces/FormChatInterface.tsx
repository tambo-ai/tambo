import { FormComponent, type FormField } from "@/components/ui/form";
import { Message } from "@/components/ui/message";
import { MessageInput } from "@/components/ui/message-input";
import {
  loginFormFields,
  registrationFormFields,
} from "@/constants/form-fields";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../index";

export const FormChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I can help you create various forms. Try the quick prompts below!",
    },
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    {
      label: "Create Login Form",
      action: () => {
        setMessages([
          ...messages,
          { role: "user", content: "Can you create a login form?" },
          {
            role: "assistant",
            content:
              "I've generated a login form with email and password fields:",
            renderedComponent: (
              <FormComponent
                fields={loginFormFields as FormField[]}
                onSubmit={(data) => console.log("Login:", data)}
                submitText="Sign In"
                variant="solid"
                layout="default"
              />
            ),
          },
        ]);
      },
    },
    {
      label: "Create Registration Form",
      action: () => {
        setMessages([
          ...messages,
          { role: "user", content: "Can you create a registration form?" },
          {
            role: "assistant",
            content: "Here's a comprehensive registration form:",
            renderedComponent: (
              <FormComponent
                fields={registrationFormFields as FormField[]}
                onSubmit={(data) => console.log("Register:", data)}
                submitText="Create Account"
                variant="bordered"
                layout="relaxed"
              />
            ),
          },
        ]);
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-[800px]">
      <div
        ref={chatContainerRef}
        className="flex-1 border rounded-lg p-4 overflow-y-auto flex flex-col gap-4"
      >
        {messages.map((message, index) => (
          <div key={index}>
            <Message
              role={message.role}
              content={message.content}
              variant={message.role === "user" ? "solid" : "default"}
              message={{
                id: `msg-${index}`,
                role: message.role,
                content: [{ type: "text", text: message.content }],
                createdAt: new Date().toISOString(),
                threadId: "form-thread",
                componentState: {},
                renderedComponent: null,
              }}
            />
            {message.renderedComponent && (
              <div className="mt-4 w-full max-w-4xl mx-auto px-4">
                {message.renderedComponent}
              </div>
            )}
          </div>
        ))}
      </div>
      <MessageInput
        contextKey="form-thread"
        variant="bordered"
        className="pointer-events-none opacity-50"
      />
      <div className="flex gap-2">
        {quickPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={prompt.action}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
