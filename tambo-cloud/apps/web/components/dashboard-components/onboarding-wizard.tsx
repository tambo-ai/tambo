import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CreateProjectDialog } from "./create-project-dialog";
import { CommandCopyButton } from "./onboarding/command-copy-button";
import { TemplateCard } from "./onboarding/template-card";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectName: string) => Promise<{ id: string }>;
}

type OnboardingStepId =
  | "welcome"
  | "path-selection"
  | "template-selection"
  | "full-send-instructions"
  | "project-creation";

type OnboardingPath = "template" | "existing-project" | "api-key";

function RecommendedIcon() {
  return <Badge variant="secondary">Recommended</Badge>;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.2,
    },
  },
};

const stepVariants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// Step configuration
interface OnboardingStepConfig {
  id: OnboardingStepId;
  title: string;
  description: string;
  type:
    | "welcome"
    | "path-selection"
    | "template-selection"
    | "instructions"
    | "project-creation";
  showBackButton?: boolean;
  nextStep?: OnboardingStepId;
  previousStep?: OnboardingStepId;
}

const steps: OnboardingStepConfig[] = [
  {
    id: "welcome",
    title: "Thank you for signing up!",
    description: "Let's get you set up!",
    type: "welcome",
    showBackButton: false,
    nextStep: "path-selection",
  },
  {
    id: "path-selection",
    title: "Choose Your Path",
    description: "Pick the option that best fits your current situation",
    type: "path-selection",
    showBackButton: true,
    previousStep: "welcome",
  },
  {
    id: "template-selection",
    title: "Choose a Template",
    description: "Select a starter template that matches your use case",
    type: "template-selection",
    showBackButton: true,
    previousStep: "path-selection",
  },
  {
    id: "full-send-instructions",
    title: "Add Tambo to Your Project",
    description:
      "Follow these steps to integrate Tambo into your existing React/Next.js application",
    type: "instructions",
    showBackButton: true,
    previousStep: "path-selection",
  },
  {
    id: "project-creation",
    title: "Create Your Project",
    description: "Create a project to get your API key and start building",
    type: "project-creation",
    showBackButton: true,
    previousStep: "path-selection",
  },
];

// Path selection options
interface PathOption {
  id: OnboardingPath;
  title: string;
  description: string;
  nextStep: OnboardingStepId;
  recommended?: boolean;
}

const pathOptions: PathOption[] = [
  {
    id: "template",
    title: "Start with a Template",
    description: "Create a new project from our starter templates",
    nextStep: "template-selection",
    recommended: true,
  },
  {
    id: "existing-project",
    title: "Add to Existing Project",
    description: "Integrate Tambo into your current React/Next.js app",
    nextStep: "full-send-instructions",
  },
  {
    id: "api-key",
    title: "I Just Need an API Key",
    description: "Create a project and get your API key to use manually",
    nextStep: "project-creation",
  },
];

const templates = [
  {
    id: "standard",
    name: "Standard",
    description:
      "General purpose AI app template with tools and MCP integration",
    command: "npx create-tambo-app@latest my-app --template=standard",
    recommended: true,
  },
  {
    id: "analytics",
    name: "Analytics",
    description:
      "Generative UI analytics template with drag-and-drop canvas and data visualization",
    command: "npx create-tambo-app@latest my-app --template=analytics",
    recommended: false,
  },
];

export function OnboardingWizard({
  open,
  onOpenChange,
  onSubmit,
}: OnboardingWizardProps) {
  const [currentStepId, setCurrentStepId] =
    useState<OnboardingStepId>("welcome");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Reset state when dialog opens to ensure users always start from the beginning
  useEffect(() => {
    if (open) {
      setCurrentStepId("welcome");
      setSelectedTemplate(null);
    }
  }, [open]);

  const currentStep = steps.find((step) => step.id === currentStepId);

  const handlePathSelection = (path: OnboardingPath) => {
    const pathOption = pathOptions.find((option) => option.id === path);
    if (pathOption) {
      setCurrentStepId(pathOption.nextStep);
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleNext = () => {
    if (currentStep?.nextStep) {
      setCurrentStepId(currentStep.nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep?.previousStep) {
      setCurrentStepId(currentStep.previousStep);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <Image
          src="/logo/icon/Octo-Icon.svg"
          alt="Tambo Logo"
          width={1000}
          height={1000}
          priority
          className="w-16 h-16"
        />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{currentStep?.title}</h2>
        <p className="text-sm font-sans text-foreground">
          {currentStep?.description}
        </p>
      </div>

      <Button onClick={handleNext} className="w-full">
        Get Started
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderPathSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{currentStep?.title}</h2>
        <p className="text-sm font-sans text-foreground">
          {currentStep?.description}
        </p>
      </div>

      <div className="space-y-3">
        {pathOptions.map((option) => (
          <Card
            key={option.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
            onClick={() => handlePathSelection(option.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <CardDescription className="text-sm font-sans text-foreground">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
                {option.recommended && <RecommendedIcon />}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        {currentStep?.showBackButton && (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <div></div>
      </div>
    </div>
  );

  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{currentStep?.title}</h2>
        <p className="text-sm font-sans text-foreground">
          {currentStep?.description}
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={() => handleTemplateSelection(template.id)}
          />
        ))}
      </div>

      <div className="flex justify-between">
        {currentStep?.showBackButton && (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                "/docs/getting-started/quickstart#template",
                "_blank",
              );
            }}
          >
            View Docs
          </Button>
        </div>
      </div>
    </div>
  );

  const renderInstructionsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{currentStep?.title}</h2>
        <p className="text-sm font-sans text-foreground">
          {currentStep?.description}
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              Quick Setup Command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CommandCopyButton command="npx tambo full-send" />

            <div className="text-sm text-foreground">
              <p>
                <strong>This command will:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>Set up Tambo in your existing project</li>
                <li>Get you an API key</li>
                <li>Install useful components</li>
                <li>Show you how to wrap your app with TamboProvider</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Manual Setup (Alternative)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground space-y-2">
              <p>If you prefer step-by-step setup:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Run: <code className="text-primary">npx tambo init</code>
                </li>
                <li>
                  Add components:{" "}
                  <code className="text-primary">
                    npx tambo add message-thread-full
                  </code>
                </li>
                <li>
                  Wrap your app with{" "}
                  <code className="text-primary">TamboProvider</code>
                </li>
                <li>
                  Add the API key to your{" "}
                  <code className="text-primary">.env.local</code> file
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        {currentStep?.showBackButton && (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              window.open(
                "/docs/getting-started/quickstart#existing-app",
                "_blank",
              );
            }}
          >
            View Docs
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProjectCreation = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{currentStep?.title}</h2>
        <p className="text-sm font-sans text-foreground">
          {currentStep?.description}
        </p>
      </div>

      <CreateProjectDialog
        embedded={true}
        onSubmit={onSubmit}
        onBack={handleBack}
        onOpenChange={() => {}}
      />
    </div>
  );

  const renderStepContent = () => {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case "welcome":
        return renderWelcomeStep();
      case "path-selection":
        return renderPathSelection();
      case "template-selection":
        return renderTemplateSelection();
      case "instructions":
        return renderInstructionsStep();
      case "project-creation":
        return renderProjectCreation();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding Wizard</DialogTitle>
        </DialogHeader>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
