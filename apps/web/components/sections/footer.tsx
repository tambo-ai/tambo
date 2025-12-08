import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer>
      <div className="relative">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
            {/* Social links - top on mobile, right on desktop */}
            <div className="flex gap-2 sm:gap-3 order-1 lg:order-3">
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

            {/* Links - middle on mobile, center on desktop */}
            <ul className="flex flex-wrap justify-center lg:justify-end gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 order-2">
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

            {/* Bottom text - bottom on mobile, left on desktop */}
            <div className="text-xs sm:text-sm text-center lg:text-left text-muted-foreground shrink-0 order-3 lg:order-1">
              <p>{siteConfig.footer.bottomText}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
