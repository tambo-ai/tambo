import config from "@tambo-ai/eslint-config/base";
import { globalIgnores } from "eslint/config";

export default [...config, globalIgnores([".github/scripts/**"])];
