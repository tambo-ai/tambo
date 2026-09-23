"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name."),
});

interface TamboSetupProjectFormProps {
  creation: "idle" | "pending" | "error";
  onCreateProject: (name: string) => void;
}

export const TamboSetupProjectForm: FC<TamboSetupProjectFormProps> = ({
  creation,
  onCreateProject,
}) => {
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "" },
  });
  const isPending = creation === "pending";

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        aria-busy={isPending}
        onSubmit={form.handleSubmit(({ name }) => {
          if (!isPending) onCreateProject(name);
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="My first AI app"
                  autoComplete="off"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {creation === "error" && (
          <p role="alert" className="text-sm text-destructive">
            We couldn&apos;t create your project. Your name is saved here; try
            again.
          </p>
        )}
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Creating project…" : "Create project"}
        </Button>
      </form>
    </Form>
  );
};
