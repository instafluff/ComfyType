import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const compat = new FlatCompat( {
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
} );

export default [ ...compat.extends( "comfycase" ), {
	ignores: [ "build/*" ],
}, {
	files: [ "**/**.{,c,m}{js,ts}" ],
	plugins: {
		"@typescript-eslint": typescriptEslint,
	},

	languageOptions: {
		globals: {
			...globals.node,
			...globals.browser,
			...globals.commonjs,
			...globals.es2021,
		},

		parser: tsParser,
		ecmaVersion: "latest",
		sourceType: "module",
	},

	rules: {
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": [ "warn" ],
	},
} ];
