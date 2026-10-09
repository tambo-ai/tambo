export interface TamboSetupProject {
  id: string;
  name: string;
}

export type TamboGettingStartedState =
  | { status: "error" }
  | { status: "needs-project"; creation: "idle" | "pending" | "error" }
  | { status: "project-created"; project: TamboSetupProject };
