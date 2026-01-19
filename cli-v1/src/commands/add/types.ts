export interface ComponentConfig {
  name: string;
  dependencies: string[];
  devDependencies: string[];
  requires?: string[];
  files: {
    name: string;
    content: string;
  }[];
}

export interface InstallComponentOptions {
  silent?: boolean;
  legacyPeerDeps?: boolean;
  forceUpdate?: boolean;
  installPath?: string;
  isExplicitPrefix?: boolean;
  yes?: boolean;
  baseInstallPath?: string;
  skipAgentDocs?: boolean;
}
