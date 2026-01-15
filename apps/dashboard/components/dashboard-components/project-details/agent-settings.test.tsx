import type { AgentProviderType } from "@tambo-ai-cloud/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { AgentSettings } from "./agent-settings";

describe("AgentSettings", () => {
  function setup() {
    const props = {
      agentProvider: "openai" as AgentProviderType,
      setAgentProvider: jest.fn(),
      agentUrl: "",
      setAgentUrl: jest.fn(),
      showValidationErrors: true,
      agentName: "",
      setAgentName: jest.fn(),
      agentHeaders: [],
      setAgentHeaders: jest.fn(),
    };
    render(<AgentSettings {...props} />);
    return props;
  }

  it("shows validation error when URL is empty and validation on", () => {
    setup();
    expect(screen.getByText(/Agent URL is required/i)).toBeInTheDocument();
  });

  it("updates agent url on change", () => {
    const props = setup();
    const input = screen.getByLabelText(/Agent URL/i);
    fireEvent.change(input, { target: { value: "https://example.com" } });
    expect(props.setAgentUrl).toHaveBeenCalledWith("https://example.com");
  });
});
