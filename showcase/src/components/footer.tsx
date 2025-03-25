import { Icons } from "@/components/icons";

export function Footer() {
  return (
    <footer className="container mx-auto">
      <div className="flex justify-center w-full">
        <div className="flex flex-row justify-between items-center p-6 lg:py-8 max-w-screen-xl w-full">
          <div className="flex items-center">
            <Icons.logo className="h-6 w-auto" aria-label="Tambo" />
          </div>

          <div className="font-sentient text-sm text-muted-foreground">
            <p>Fractal Dynamics Inc © 2025</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
