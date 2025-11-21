import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer>
      <div className="relative">
        <div className="flex flex-col space-y-4 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 sm:gap-4">
            <div className="flex gap-2 sm:gap-3 self-center sm:self-end sm:ml-auto">
              {siteConfig.footer.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <ul className="flex flex-wrap justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2">
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
