import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="container">
      <div className="relative">
        <div className="flex flex-col space-y-6 p-6 lg:p-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6">
                <Icons.logo className="w-6 h-6" />
              </div>
              <Image
                src="/assets/landing/wordmark-placeholder.png"
                alt={siteConfig.name}
                width={160}
                height={50}
                className="h-10 w-auto"
              />
            </div>

            <div className="flex gap-x-4">
              {siteConfig.footer.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <ul className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-4">
              {siteConfig.footer.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
            <div className="text-sm text-center sm:text-left text-muted-foreground">
              <p>{siteConfig.footer.bottomText}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
