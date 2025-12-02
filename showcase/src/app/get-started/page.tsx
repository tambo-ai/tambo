import { CLI } from "@/components/cli";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { existingProjectSteps, newProjectSteps } from "@/constants/steps";

export default function GetStartedPage() {
  return (
    <div className="max-w-8xl">
      <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 font-sentient">
        Get Started
      </h1>
      <p className="text-base md:text-lg text-muted-foreground mb-8">
        Follow these steps to get started with tambo-ai.
      </p>

      <Tabs defaultValue="new-project" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-project">New Project</TabsTrigger>
          <TabsTrigger value="existing-project">Existing Project</TabsTrigger>
        </TabsList>

        <TabsContent value="new-project" className="mt-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">
            New project setup
          </h2>
          {newProjectSteps.map((step) => (
            <div
              key={step.number}
              className="mb-8 pb-8 border-b last:border-b-0"
            >
              <h3 className="text-lg sm:text-xl font-medium mb-2">
                {step.number}: {step.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                {step.description}
              </p>
              <CLI
                command={step.code}
                path={step.path}
                isCode={step.isCode}
                language={step.language}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="existing-project" className="mt-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">
            Add tambo-ai to an existing project
          </h2>
          {existingProjectSteps.map((step) => (
            <div
              key={step.number}
              className="mb-8 pb-8 border-b last:border-b-0"
            >
              <h3 className="text-lg sm:text-xl font-medium mb-2">
                {step.number}: {step.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                {step.description}
              </p>
              <CLI
                command={step.code}
                path={step.path}
                isCode={step.isCode}
                language={step.language}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
