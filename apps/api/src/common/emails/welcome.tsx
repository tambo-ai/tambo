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
import type { Email, WelcomeEmailVariables } from "./types";

function WelcomeEmailComponent({
  firstName,
}: WelcomeEmailVariables): React.ReactElement {
  const displayName = firstName?.trim() || "there";

  return (
    <Html lang="en">
      <Head />
      <Preview>Your account is ready. Pick a setup path and go.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://tambo.co/logo/lockup/Tambo-Lockup.png"
            alt="tambo"
            width="150"
            style={logo}
          />

          <Heading style={h1}>Hey {displayName}, you&apos;re in.</Heading>
          <Text style={paragraph}>
            Tambo lets you build agents that render your actual React
            components. You register them with Zod schemas, and the agent picks
            the right one and streams the props. Pick a setup path below.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>Start fresh</Text>
            <Text style={cardText}>
              Creates a new project with the SDK, a sample component, and a
              working agent:
            </Text>
            <code style={codeBlock}>npm create tambo-app@latest my-app</code>
          </Section>

          <Section style={card}>
            <Text style={cardTitle}>Add to your React app</Text>
            <Text style={cardText}>
              Already have an app? One command to drop Tambo in:
            </Text>
            <code style={codeBlock}>npx tambo full-send</code>
          </Section>

          <Section style={card}>
            <Text style={cardTitle}>Just grab an API key</Text>
            <Text style={cardText}>
              Create a project in the dashboard and you&apos;re set.
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Link href="https://console.tambo.co" style={button}>
              Open Dashboard
            </Link>
          </Section>

          <Text style={listItem}>
            {"\u2022"}{" "}
            <Link
              href="https://docs.tambo.co/getting-started/quickstart"
              style={link}
            >
              Quickstart guide
            </Link>{" "}
            - walks through the full setup
          </Text>
          <Text style={listItem}>
            {"\u2022"}{" "}
            <Link href="https://ui.tambo.co" style={link}>
              Component library
            </Link>{" "}
            - pre-built components you can add with <code>npx tambo add</code>
          </Text>
          <Text style={listItem}>
            {"\u2022"}{" "}
            <Link href="https://tambo.co/discord" style={link}>
              Discord
            </Link>{" "}
            - if you get stuck or want to show off what you&apos;re building
          </Text>

          <Hr style={hr} />
          <Text style={footer}>The Tambo Team</Text>
        </Container>
        <Text style={copyright}>Fractal Dynamics Inc</Text>
      </Body>
    </Html>
  );
}

export const welcomeEmail: Email<WelcomeEmailVariables> = {
  subject: "You're in. Pick a setup path.",
  component: (variables) => <WelcomeEmailComponent {...variables} />,
};

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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

const card: React.CSSProperties = {
  backgroundColor: "#F3F4F6",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "16px",
};

const cardTitle: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: 700,
  margin: "0 0 4px",
};

const cardText: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const codeBlock: React.CSSProperties = {
  display: "block",
  backgroundColor: "#1F2937",
  color: "#7FFFC4",
  padding: "10px 14px",
  borderRadius: "6px",
  fontSize: "14px",
  marginTop: "8px",
  fontFamily: "'Courier New', monospace",
};

const buttonSection: React.CSSProperties = {
  margin: "32px 0",
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

const listItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
};

const link: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
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
