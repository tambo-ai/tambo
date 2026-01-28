"use client";

import { TamboProvider } from "@tambo-ai/react";
import { queryRecords } from "../components/tambo/queryRecords";
import { addRecord } from "../components/tambo/addRecord";
import { updateRecord } from "../components/tambo/updateRecord";
import { deleteRecord } from "../components/tambo/deleteRecord";
import {
  AnalyticsTable,
  AnalyticsTableSchema,
} from "../components/tambo/AnalyticsTable";

const components = [
  {
    name: "AnalyticsTable",
    description: "Displays analytics records in a table",
    component: AnalyticsTable,
    propsSchema: AnalyticsTableSchema,
  },
];

const tools = [queryRecords, addRecord, updateRecord, deleteRecord];

export function Providers({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY || "";

  return (
    <TamboProvider apiKey={apiKey} tools={tools} components={components}>
      {children}
    </TamboProvider>
  );
}
