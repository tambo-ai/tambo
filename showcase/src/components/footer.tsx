import { Icons } from "@/components/icons";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-background/90 backdrop-blur-sm border-t border-border/50 z-10">
      <div className="flex justify-between items-center w-full px-4 md:px-6 py-4">
        <div className="flex items-center">
          <Icons.logo className="h-6 w-auto" aria-label="Tambo" />
        </div>

        <div className="font-sentient text-sm text-muted-foreground">
          <p>Fractal Dynamics Inc © 2025</p>
        </div>
      </div>
    </footer>
  );
}
