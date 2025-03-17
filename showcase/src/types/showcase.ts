export interface ShowcaseItem {
  title: string;
  description: string;
  installCommand: string;
  component: React.ReactNode;
}

export interface ShowcaseSection {
  title: string;
  items: ShowcaseItem[];
}
