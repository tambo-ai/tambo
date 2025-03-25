import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer>
      <div className="relative">
        <div className="flex flex-col space-y-6 p-4 sm:p-6 lg:p-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center">
              <Icons.logo
                className="h-5 sm:h-6 w-auto"
                aria-label={siteConfig.name}
              />
            </div>

            <div className="flex gap-3 sm:gap-4">
              {siteConfig.footer.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <ul className="flex flex-wrap justify-center sm:justify-start gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-4">
              {siteConfig.footer.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className="text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
            <div className="text-xs sm:text-sm text-center sm:text-left text-muted-foreground">
              <p>{siteConfig.footer.bottomText}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
