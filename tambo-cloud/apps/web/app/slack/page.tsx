import * as React from "react";
import { SlackChannelForm } from "@/components/forms/slack-channel-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SlackPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12">
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Create a Slack Channel</CardTitle>
          <CardDescription>
            Fill out the form below to create your dedicated Slack channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SlackChannelForm />
        </CardContent>
      </Card>
    </div>
  );
}
