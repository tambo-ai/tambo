import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import TopNav from "@/components/top-nav";

export const baseOptions: BaseLayoutProps = {
  nav: {
    component: <TopNav />,
  },
  searchToggle: {
    enabled: false,
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
  themeSwitch: {
    enabled: false,
  },
};
