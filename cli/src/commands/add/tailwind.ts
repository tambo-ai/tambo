import chalk from "chalk";
import deepmerge from "deepmerge";
import fs from "fs";
import path from "path";
import type { Root } from "postcss";
import postcss from "postcss";
import type { Config } from "tailwindcss";
import { Project, ScriptKind, SyntaxKind } from "ts-morph";
import { fileURLToPath } from "url";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up Tailwind CSS and global styles for the project
 * @param projectRoot The root directory of the project
 */
export async function setupTailwindandGlobals(projectRoot: string) {
	const tailwindConfigPath = path.join(projectRoot, "tailwind.config.ts");
	const globalsPath = path.join(projectRoot, "src", "app", "globals.css");

	const registryPath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"src",
		"registry",
	);
	const defaultTailwindConfig = path.join(
		registryPath,
		"config",
		"tailwind.config.ts",
	);
	const defaultGlobalsCSS = path.join(registryPath, "config", "globals.css");

	// Initialize flags to track if updates are needed
	let configUpdated = false;
	let globalsUpdated = false;

	// Handle tailwind.config.ts
	if (!fs.existsSync(tailwindConfigPath)) {
		fs.copyFileSync(defaultTailwindConfig, tailwindConfigPath);
		console.log(`${chalk.green("✔")} Created tailwind.config.ts`);
	} else {
		// Create a new TypeScript project
		const project = new Project({
			skipFileDependencyResolution: true,
			compilerOptions: { allowJs: true },
		});

		// Add both config files to the project
		const existingConfigFile = project.createSourceFile(
			"existing.ts",
			fs.readFileSync(tailwindConfigPath, "utf-8"),
			{ scriptKind: ScriptKind.TS },
		);

		const defaultConfigFile = project.createSourceFile(
			"default.ts",
			fs.readFileSync(defaultTailwindConfig, "utf-8"),
			{ scriptKind: ScriptKind.TS },
		);

		// Extract config objects
		const existingConfig = existingConfigFile
			.getVariableDeclaration("config")
			?.getInitializer()
			?.getText();

		const defaultConfig = defaultConfigFile
			.getVariableDeclaration("config")
			?.getInitializer()
			?.getText();

		if (existingConfig && defaultConfig) {
			const parseConfigObject = (
				sourceFile: string,
				configName: string,
			): Config => {
				try {
					// Create a temporary source file to parse the config object
					const tempProject = new Project({
						skipFileDependencyResolution: true,
						compilerOptions: {
							allowJs: true,
							strict: true,
						},
					});

					const tempFile = tempProject.createSourceFile(
						"temp.ts",
						`const parsed = ${sourceFile}`,
						{ scriptKind: ScriptKind.TS },
					);

					const initializer = tempFile
						.getVariableDeclaration("parsed")
						?.getInitializer();

					if (!initializer) {
						throw new Error(`Invalid config structure in ${configName}`);
					}

					// Validate it's an object literal expression
					if (initializer.getKind() !== SyntaxKind.ObjectLiteralExpression) {
						throw new Error(
							`Config in ${configName} must be an object literal`,
						);
					}

					// Convert the object literal to a plain object using ts-morph
					const objectLiteral = initializer.asKind(
						SyntaxKind.ObjectLiteralExpression,
					);
					if (!objectLiteral) {
						throw new Error(`Failed to parse config object in ${configName}`);
					}

					const result: Record<string, unknown> = {};

					for (const property of objectLiteral.getProperties()) {
						if (property.getKind() === SyntaxKind.PropertyAssignment) {
							const propAssignment = property.asKind(
								SyntaxKind.PropertyAssignment,
							);
							if (propAssignment) {
								const name = propAssignment
									.getName()
									.replace(/^["']|["']$/g, "");
								const initializer = propAssignment.getInitializer();
								if (initializer) {
									try {
										// Handle different types of values
										if (
											initializer.getKind() ===
											SyntaxKind.ObjectLiteralExpression
										) {
											result[name] = parseConfigObject(
												initializer.getText(),
												`${configName}.${name}`,
											);
										} else if (
											initializer.getKind() ===
											SyntaxKind.ArrayLiteralExpression
										) {
											const arrayLiteral = initializer.asKind(
												SyntaxKind.ArrayLiteralExpression,
											);
											if (arrayLiteral) {
												result[name] = arrayLiteral
													.getElements()
													.map((element) => {
														if (
															element.getKind() ===
															SyntaxKind.ObjectLiteralExpression
														) {
															return parseConfigObject(
																element.getText(),
																`${configName}.${name}[]`,
															);
														}
														const text = element.getText();
														return text.startsWith('"') || text.startsWith("'")
															? text.slice(1, -1)
															: text;
													});
											}
										} else if (
											initializer.getKind() === SyntaxKind.SpreadElement
										) {
											// Skip spread elements as they're not valid in JSON
											continue;
										} else if (
											initializer.getKind() === SyntaxKind.AsExpression
										) {
											// Handle type assertions by getting the expression
											const asExpression = initializer.asKind(
												SyntaxKind.AsExpression,
											);
											const text =
												asExpression?.getExpression().getText() || "";
											result[name] =
												text.startsWith('"') || text.startsWith("'")
													? text.slice(1, -1)
													: text;
										} else {
											// For primitive values
											const text = initializer.getText();
											// Handle string literals by removing quotes
											result[name] =
												text.startsWith('"') || text.startsWith("'")
													? text.slice(1, -1)
													: text;
										}
									} catch (error) {
										console.warn(
											`Warning: Skipping property "${name}" due to parsing error ${error}`,
										);
										continue;
									}
								}
							}
						} else if (property.getKind() === SyntaxKind.SpreadAssignment) {
							// Skip spread assignments as they're not valid in JSON
							continue;
						}
					}

					// Validate essential Tailwind config properties
					if (!result.content && configName === "default") {
						throw new Error(
							"Default Tailwind config must specify content paths",
						);
					}

					return result as Config;
				} catch (error) {
					if (error instanceof Error) {
						throw new Error(
							`Failed to parse ${configName} config: ${error.message}`,
						);
					}
					throw new Error(`Unknown error parsing ${configName} config`);
				}
			};

			try {
				const existing = parseConfigObject(existingConfig, "existing");
				const defaults = parseConfigObject(defaultConfig, "default");

				// Deep merge the configurations, with existing taking precedence
				const merged = deepmerge(defaults, existing, {
					arrayMerge: (target, source) => [...new Set([...target, ...source])],
				}) as Config;

				// Update the theme colors specifically
				if (defaults.theme?.colors) {
					if (!merged.theme) merged.theme = {};
					merged.theme.colors = defaults.theme.colors;
				}

				// Write back the merged config with error handling
				const formattedConfig = `import type { Config } from 'tailwindcss'

const config: Config = ${JSON.stringify(merged, null, 2)}

export default config`;

				// Only update and log if there were actual changes
				if (JSON.stringify(existing) !== JSON.stringify(merged)) {
					try {
						// Create backup of existing config
						if (fs.existsSync(tailwindConfigPath)) {
							fs.copyFileSync(
								tailwindConfigPath,
								`${tailwindConfigPath}.backup`,
							);
						}

						// Write new config
						fs.writeFileSync(tailwindConfigPath, formattedConfig);
						configUpdated = true;

						// Remove backup if successful
						if (fs.existsSync(`${tailwindConfigPath}.backup`)) {
							fs.unlinkSync(`${tailwindConfigPath}.backup`);
						}
					} catch (error) {
						// Restore from backup if available
						if (fs.existsSync(`${tailwindConfigPath}.backup`)) {
							fs.copyFileSync(
								`${tailwindConfigPath}.backup`,
								tailwindConfigPath,
							);
							fs.unlinkSync(`${tailwindConfigPath}.backup`);
						}
						throw error;
					}
				}
			} catch (error) {
				throw new Error(`Failed to merge configs: ${error}`);
			}
		}
	}

	if (configUpdated) {
		console.log(`${chalk.green("✔")} Updated tailwind.config.ts`);
	}

	// Handle globals.css
	fs.mkdirSync(path.dirname(globalsPath), { recursive: true });

	if (!fs.existsSync(globalsPath)) {
		fs.copyFileSync(defaultGlobalsCSS, globalsPath);
		console.log(`${chalk.green("✔")} Created globals.css`);
	} else {
		const existingCSS = fs.readFileSync(globalsPath, "utf-8");
		const defaultCSS = fs.readFileSync(defaultGlobalsCSS, "utf-8");

		const existingRoot = postcss.parse(existingCSS);
		const defaultRoot = postcss.parse(defaultCSS);

		// Find or create the @layer base rule
		let baseLayer = existingRoot.nodes.find(
			(node): node is postcss.AtRule =>
				node.type === "atrule" &&
				node.name === "layer" &&
				node.params === "base",
		);

		if (!baseLayer) {
			baseLayer = postcss.atRule({
				name: "layer",
				params: "base",
				raws: { before: "\n\n", after: "\n" },
			});
			existingRoot.append(baseLayer);
		}

		// Extract default variables
		const extractVariables = (root: Root, selector: string) => {
			const vars = new Map<string, string>();
			root.walkAtRules("layer", (layer) => {
				if (layer.params === "base") {
					layer.walkRules(selector, (rule) => {
						rule.walkDecls((decl) => {
							if (decl.prop.startsWith("--")) {
								vars.set(decl.prop, decl.value);
							}
						});
					});
				}
			});
			return vars;
		};

		const defaultRootVars = extractVariables(defaultRoot, ":root");
		const defaultDarkVars = extractVariables(defaultRoot, ".dark");

		// Function to ensure a section exists and update its variables
		const ensureSection = (
			selector: string,
			variables: Map<string, string>,
		) => {
			let sectionRule = baseLayer.nodes?.find(
				(node): node is postcss.Rule =>
					node.type === "rule" && node.selector === selector,
			);

			if (!sectionRule) {
				sectionRule = postcss.rule({
					selector: selector,
					raws: { before: "\n  ", after: "\n" },
				});
				baseLayer.append(sectionRule);
			}

			variables.forEach((value, prop) => {
				if (
					!sectionRule.nodes?.some(
						(node) => node.type === "decl" && node.prop === prop,
					)
				) {
					sectionRule.append(
						postcss.decl({
							prop,
							value,
							raws: { before: "\n    ", between: ": " },
						}),
					);
				}
			});
		};

		// Ensure both sections exist and have all required variables
		ensureSection(":root", defaultRootVars);
		ensureSection(".dark", defaultDarkVars);

		// Write updated CSS
		const updatedCSS = existingRoot.toString();

		// Only update if there were changes
		const originalContent = fs.readFileSync(globalsPath, "utf-8");

		if (originalContent !== updatedCSS) {
			fs.writeFileSync(globalsPath, updatedCSS);
			globalsUpdated = true;
		}
	}

	if (globalsUpdated) {
		console.log(`${chalk.green("✔")} Updated globals.css`);
	}
}
