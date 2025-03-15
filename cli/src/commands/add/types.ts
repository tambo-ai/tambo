export interface ComponentConfig {
	name: string;
	dependencies: string[];
	devDependencies: string[];
	requires?: string[];
	files: Array<{
		name: string;
		content: string;
	}>;
}

export interface InstallComponentOptions {
	silent?: boolean;
	legacyPeerDeps?: boolean;
}
