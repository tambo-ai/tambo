import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import type { Email, MessageLimitEmailVariables } from "./types";

function MessageLimitEmailComponent({
  projectId,
  projectName,
  messageLimit,
}: MessageLimitEmailVariables): React.ReactElement {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        {`You've reached your free message limit of ${messageLimit} messages`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://tambo.co/logo/lockup/Tambo-Lockup.png"
            alt="tambo"
            width="150"
            style={logo}
          />

          <Heading style={h1}>Message Limit Reached</Heading>
          <Text style={paragraph}>
            You&apos;ve reached your free message limit of {messageLimit}{" "}
            messages for your project:
          </Text>

          <Section style={projectBox}>
            <Text style={projectNameStyle}>{projectName}</Text>
            <Text style={projectIdStyle}>({projectId})</Text>
          </Section>

          <Text style={paragraph}>
            To continue using the service, you have two options:
          </Text>
          <Text style={listItem}>
            1. Add your own LLM provider (like OpenAI) to your project
          </Text>
          <Text style={listItem}>
            2. Contact us at{" "}
            <Link href="mailto:support@tambo.co" style={link}>
              support@tambo.co
            </Link>{" "}
            to discuss enterprise options
          </Text>

          <Section style={buttonSection}>
            <Link href={`https://console.tambo.co/${projectId}`} style={button}>
              Go to Your Project
            </Link>
          </Section>

          <Text style={paragraph}>Thank you for using tambo!</Text>

          <Hr style={hr} />
          <Text style={footer}>
            Best regards,
            <br />
            The tambo-ai team
          </Text>
        </Container>
        <Text style={copyright}>Fractal Dynamics Inc</Text>
      </Body>
    </Html>
  );
}

export const messageLimitEmail: Email<MessageLimitEmailVariables> = {
  subject: "tambo ai - Free Message Limit Reached",
  component: (variables) => <MessageLimitEmailComponent {...variables} />,
};

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f9fafb",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "white",
};

const logo: React.CSSProperties = {
  marginBottom: "20px",
};

const h1: React.CSSProperties = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: 600,
  margin: "0 0 20px",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const projectBox: React.CSSProperties = {
  backgroundColor: "#F3F4F6",
  padding: "12px 16px",
  borderRadius: "6px",
  marginBottom: "20px",
};

const projectNameStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: 700,
  margin: "0",
  display: "inline",
};

const projectIdStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  marginLeft: "8px",
  display: "inline",
};

const listItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 10px",
};

const link: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};

const buttonSection: React.CSSProperties = {
  margin: "40px 0",
  textAlign: "center" as const,
};

const button: React.CSSProperties = {
  backgroundColor: "#7FFFC4",
  color: "#023A41",
  padding: "12px 24px",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 500,
  display: "block",
  textAlign: "center" as const,
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const copyright: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  textAlign: "center" as const,
  padding: "20px",
};
