import { ModuleKind, type Diagnostic } from "typescript";
import dtsPlugin, {
  type PluginOptions as DtsPluginOptions,
} from "vite-plugin-dts";
import { type Options } from "../options";

export const tamboDtsPlugin = (options: Options) => {
  const { outDir, srcDir, exclude, tsconfigPath } = options;

  const afterDiagnostic = (diagnostics: readonly Diagnostic[]) => {
    if (diagnostics.length > 0) {
      console.error("Please fix the above type errors");
      process.exit(1);
    }
  };

  const basePluginOptions: DtsPluginOptions = {
    entryRoot: srcDir,
    include: srcDir,
    exclude,
    tsconfigPath,
    afterDiagnostic,
  };

  return [
    dtsPlugin({
      ...basePluginOptions,
      outDir: `${outDir}/esm`,
      compilerOptions: {
        module: ModuleKind.ES2020,
        declarationMap: true,
      },
    }),
    options.enableCjs
      ? dtsPlugin({
          ...basePluginOptions,
          outDir: `${outDir}/cjs`,
          compilerOptions: {
            module: ModuleKind.CommonJS,
            declarationMap: true,
          },
          beforeWriteFile: (filePath, content) => ({
            filePath: filePath.replace(".d.ts", ".d.cts"),
            content,
          }),
        })
      : undefined,
  ];
};
