#!/usr/bin/env node
import meow from "meow";
import * as fs from "fs";
import { execa } from "execa";
import { PackageJson } from "@npm/types";

export enum ComfyTypeCommands {
	None = "",
	Init = "init",
};

const cli = meow( `
	Usage $ comfytype <command> [options]

	Commands
		init		Configures project for TypeScript with the comfiest settings
	
	Options
		--help		Prints this help message
	
	Examples
	$ comfytype init
`, {
	importMeta: import.meta,
	flags: {
		help: { type: "boolean" },
	},
} );

const comfyPackage = cli.pkg;

function addScripts( packageJson : PackageJson ) {
	console.info( "Adding package.json script commands..." );
	// Ensure a scripts section
	if( !packageJson.scripts ) {
		packageJson.scripts = {};
	}

	packageJson.scripts[ "start" ] = "npm run build && node build/index.js";
	packageJson.scripts[ "build" ] = "tsc";
	packageJson.scripts[ "clean" ] = "rimraf ./build/";
	packageJson.scripts[ "test" ] = "jest";
	packageJson.scripts[ "lint" ] = "eslint . --ext .js,.ts";
}

function addDependencies( packageJson : PackageJson ) {
	console.info( "Adding package.json dependencies..." );

	// Ensure a scripts section
	if( !packageJson.devDependencies ) {
		packageJson.devDependencies = {};
	}

	if( comfyPackage?.devDependencies ) {
		packageJson.devDependencies[ "@types/jest" ] = comfyPackage.devDependencies[ "@types/jest" ] as string;
		packageJson.devDependencies[ "@typescript-eslint/eslint-plugin" ] = comfyPackage.devDependencies[ "@typescript-eslint/eslint-plugin" ] as string;
		packageJson.devDependencies[ "@typescript-eslint/parser" ] = comfyPackage.devDependencies[ "@typescript-eslint/parser" ] as string;
		packageJson.devDependencies[ "eslint" ] = comfyPackage.devDependencies[ "eslint" ] as string;
		packageJson.devDependencies[ "eslint-config-comfycase" ] = comfyPackage.devDependencies[ "eslint-config-comfycase" ] as string;
		packageJson.devDependencies[ "jest" ] = comfyPackage.devDependencies[ "jest" ] as string;
		packageJson.devDependencies[ "rimraf" ] = comfyPackage.devDependencies[ "rimraf" ] as string;
		packageJson.devDependencies[ "typescript" ] = comfyPackage.devDependencies[ "typescript" ] as string;
	}
}

async function saveOrUpdatePackageJson() {
	console.info( "Configuring package.json..." );

	if( !fs.existsSync( "package.json" ) ) {
		console.info( "package.json does not exist. Creating one in the directory..." );
		// run npm init for the user
		const { stdout } = await execa( "npm", [ "init", "-y" ] );
		console.log( stdout );
	}
	const packageJson = JSON.parse( fs.readFileSync( "package.json" ).toString() );
	addScripts( packageJson );
	addDependencies( packageJson );
	fs.writeFileSync( "package.json", JSON.stringify( packageJson, null, "  " ) + "\n" );
}

function saveTsconfigJson() {
	console.info( "Creating tsconfig.json..." );

	const tsconfigJson = {
		"compilerOptions": {
			"outDir": "./build",
			"sourceMap": true,
			"declaration": true,
			"strict": true,
			"target": "ES6",
			"lib": [ "ES6", "DOM" ],
			"module": "CommonJS",
			"allowJs": true,
			"moduleResolution": "node",
			"esModuleInterop": true,
			"resolveJsonModule": true,
			"allowSyntheticDefaultImports": true,
			"experimentalDecorators": true,
		},
		"include": [
			"./src/**/*",
		],
		"exclude": [
			"node_modules",
		],
	};
	
	fs.writeFileSync( "tsconfig.json", JSON.stringify( tsconfigJson, null, "\t" ) + "\n" );
}

function createEslintConfig() {
	console.info( "Creating eslint.config.js.." );

	const eslintConfig =
`import typescriptEslint from "@typescript-eslint/eslint-plugin";
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
`;

	fs.writeFileSync( "eslint.config.js", eslintConfig );
}

function saveEditorConfig() {
	console.info( "Saving .editorconfig..." );

	const editorConfig =
`root = true
[*.ts]
indent_style = tab
indent_size = 4
charset = utf-8
end_of_line = lf
insert_final_newline = true
`;

	fs.writeFileSync( ".editorconfig", editorConfig );
}

function setupFolderStructure() {
	if( !fs.existsSync( "./src" ) ) {
		console.info( "/src folder does not exist. Creating project folder structure..." );
		fs.mkdirSync( "./src" );
		fs.writeFileSync( "./src/index.ts", `console.log( "Hello Comfy World!" );` );
	}
}

switch( cli.input[ 0 ] as ComfyTypeCommands || ComfyTypeCommands.None ) {
case ComfyTypeCommands.None:
case ComfyTypeCommands.Init:
	{
		try {
			console.info( "Configuring TypeScript project in this directory..." );
			await saveOrUpdatePackageJson();
			saveTsconfigJson();
			createEslintConfig();
			saveEditorConfig();
			setupFolderStructure();
			console.info( "Complete! 'npm install' and then 'npm start' to build and run" );
		}
		catch( error ) {
			console.error( error );
		}
	}
	break;
default:
	cli.showHelp();
	break;
}
