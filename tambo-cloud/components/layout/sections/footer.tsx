import { Separator } from "@/components/ui/separator";
import { ChevronsDownIcon } from "lucide-react";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="footer" className="container py-12 sm:py-32">
      <div className="p-4 bg-card border border-secondary rounded-2xl flex justify-center items-center">
        <section className="text-center">
          <h3 className="">Fractal Dynamics Inc &copy; 2024</h3>
        </section>
      </div>
    </footer>
  );
};
