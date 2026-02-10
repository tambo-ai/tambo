import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";
import type { Email, FirstMessageEmailVariables } from "./types";

function FirstMessageEmailComponent({
  firstName,
  projectName,
}: FirstMessageEmailVariables): React.ReactElement {
  const displayName = firstName?.trim() || "there";

  return (
    <Html lang="en">
      <Head />
      <Preview>You just sent your first message in {projectName}!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Hey {displayName}!</Heading>
          <Text style={paragraph}>
            Awesome - you just sent your first message in {projectName}! 🎉
          </Text>
          <Text style={paragraph}>
            Since you&apos;re getting the hang of it, here are some things you
            can explore next:
          </Text>
          <Text style={listItem}>
            {"\u2022"}{" "}
            <Link href="https://ui.tambo.co/" style={link}>
              Try tambo Components
            </Link>{" "}
            - Try <code>npx tambo add &quot;component-name&quot;</code> to get
            tambo integrated components
          </Text>
          <Text style={listItem}>
            {"\u2022"}{" "}
            <Link href="https://docs.tambo.co/concepts/tools" style={link}>
              Register Tools
            </Link>{" "}
            - Register tools in your project
          </Text>
          <Text style={listItem}>
            {"\u2022"}{" "}
            <Link
              href="https://docs.tambo.co/concepts/model-context-protocol"
              style={link}
            >
              Use MCP Servers
            </Link>{" "}
            - Connect to databases, APIs, and more without writing custom tools
          </Text>
          <Text style={paragraph}>
            Questions? Just reply to this email or hop into our{" "}
            <Link href="https://tambo.co/discord" style={link}>
              Discord
            </Link>{" "}
            - we&apos;re always around to help.
          </Text>
          <Text style={paragraph}>Happy building!</Text>
          <Text style={signature}>
            Michael
            <br />
            Co-Founder, tambo
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const firstMessageEmail: Email<FirstMessageEmailVariables> = {
  subject: "Nice work sending your first message! 🎉",
  component: (variables) => <FirstMessageEmailComponent {...variables} />,
};

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const h1: React.CSSProperties = {
  color: "#000",
  fontSize: "18px",
  fontWeight: 600,
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#000",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const listItem: React.CSSProperties = {
  color: "#000",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const link: React.CSSProperties = {
  color: "#0066cc",
  textDecoration: "underline",
};

const signature: React.CSSProperties = {
  color: "#000",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "16px 0 0",
};
