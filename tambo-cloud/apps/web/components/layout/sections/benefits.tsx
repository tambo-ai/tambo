import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface BenefitsProps {
  icon: string;
  title: string;
  description: string;
}

const benefitList: BenefitsProps[] = [
  {
    icon: "Zap",
    title: "Rapid Prototyping",
    description:
      "Accelerate your development process with Hydra AI's ability to quickly generate and iterate on UI components based on natural language instructions.",
  },
  {
    icon: "Palette",
    title: "Dynamic UI Generation",
    description:
      "Create responsive and context-aware user interfaces on-the-fly, adapting to user needs and preferences in real-time.",
  },
  {
    icon: "Code",
    title: "Simplified Development",
    description:
      "Reduce boilerplate code and streamline your workflow by leveraging Hydra AI's intelligent component generation and management system.",
  },
  {
    icon: "Lightbulb",
    title: "AI-Powered Creativity",
    description:
      "Unlock new possibilities in UI design by harnessing the creative potential of AI to generate unique and innovative interface solutions.",
  },
];

export const BenefitsSection = () => {
  return (
    <section id="benefits" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div>
          <h2 className="text-lg text-primary mb-2 tracking-wider">Benefits</h2>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Empowering Developers with AI-Driven UI
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Hydra AI revolutionizes React development by seamlessly integrating
            artificial intelligence into your UI creation process. Our
            innovative package enables rapid prototyping, dynamic component
            generation, and intuitive user interfaces, all powered by
            cutting-edge AI technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 w-full">
          {benefitList.map(({ icon, title, description }, index) => (
            <Card
              key={title}
              className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={32}
                    color="hsl(var(--primary))"
                    className="mb-6 text-primary"
                  />
                  <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                    0{index + 1}
                  </span>
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
