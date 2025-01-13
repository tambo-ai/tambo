import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface FeaturesProps {
  icon: string;
  title: string;
  description: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: "Brain",
    title: "AI-Powered UI Generation",
    description:
      "Hydra AI leverages advanced machine learning to generate responsive and context-aware user interfaces based on natural language instructions.",
  },
  {
    icon: "Zap",
    title: "Rapid Prototyping",
    description:
      "Accelerate your development process with Hydra AI's ability to quickly generate and iterate on UI components, reducing time-to-market.",
  },
  {
    icon: "Puzzle",
    title: "Seamless Integration",
    description:
      "Easily integrate Hydra AI into your existing React projects with our intuitive API and comprehensive documentation.",
  },
  {
    icon: "Palette",
    title: "Customizable Styling",
    description:
      "Maintain brand consistency with Hydra AI's ability to adapt to your project's design system and theming preferences.",
  },
  {
    icon: "Code",
    title: "Code Generation",
    description:
      "Generate clean, maintainable React code for your AI-created components, allowing for easy customization and extension.",
  },
  {
    icon: "Sparkles",
    title: "Intelligent Suggestions",
    description:
      "Receive AI-powered suggestions for UI improvements and optimizations based on best practices and user interaction patterns.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Features
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Empowering Your Development with Hydra AI
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        Discover how Hydra AI revolutionizes React development with its
        innovative features, designed to streamline your workflow and enhance
        your UI creation process.
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ icon, title, description }) => (
          <div key={title}>
            <Card className="h-full bg-background border-0 shadow-none">
              <CardHeader className="flex justify-center items-center">
                <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={24}
                    color="hsl(var(--primary))"
                    className="text-primary"
                  />
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground text-center">
                {description}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};
