#!/usr/bin/env node
import meow from "meow";
import * as fs from "fs";
import { Dependencies, PackageJson } from "@npm/types";

export enum ComfyTypeCommands {
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

function saveOrUpdatePackageJson() {
	if( !fs.existsSync( "package.json" ) ) {
		// TODO: run npm init
	}
	const packageJson = JSON.parse( fs.readFileSync( "package.json" ).toString() );
	addScripts( packageJson );
	addDependencies( packageJson );
	fs.writeFileSync( "package.json", JSON.stringify( packageJson, null, "  " ) + "\n" );
}

function saveEslintJson() {
	const eslintJson = {
		"env": {
			"browser": true,
			"commonjs": true,
			"es2021": true,
		},
		"extends": "comfycase",
		"parser": "@typescript-eslint/parser",
		"parserOptions": {
			"ecmaVersion": "latest",
			"sourceType": "module",
		},
		"plugins": [
			"@typescript-eslint",
		],
		"rules": {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [ "warn" ],
		},
	};

	fs.writeFileSync( ".eslintrc.json", JSON.stringify( eslintJson, null, "\t" ) + "\n" );
}

function saveEditorConfig() {
	const editorConfig =
`root = true
[*.ts]
indent_style = tab
indent_size = 4
charset = utf-8
end_of_line = lf
`;

	fs.writeFileSync( ".editorconfig", editorConfig );
}

switch( cli.input[ 0 ] as ComfyTypeCommands ) {
case "init":
	{
		try {
			saveOrUpdatePackageJson();
			saveEslintJson();
			saveEditorConfig();
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
