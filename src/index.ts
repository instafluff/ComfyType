#!/usr/bin/env node
import meow from "meow";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import { PackageJson } from "@npm/types";

export enum ComfyTypeCommands {
	None = "",
	Init = "init",
};

type ModulePreference = "auto" | "module" | "commonjs";
type ModuleScheme = "module" | "commonjs";

type DraftPackageJson = PackageJson & {
	type?: string;
	module?: string;
	exports?: unknown;
	scripts?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

const cli = meow( `
	Usage $ comfytype <command> [options]

	Commands
		init		Configures project for TypeScript with the comfiest settings
	
	Options
		--module	Selects the module system for generated config (auto | module | commonjs)
		--help		Prints this help message

	Examples
	$ comfytype init
	$ comfytype init --module=module
	$ comfytype init --module=commonjs
`, {
	importMeta: import.meta,
	flags: {
		module: {
			type: "string",
			default: "auto",
		},
	},
} );

const comfyPackage = cli.pkg as DraftPackageJson | undefined;

async function fileExists( filePath : string ) {
	try {
		await access( filePath, fsConstants.F_OK );
		return true;
	}
	catch {
		return false;
	}
}

function normalizeModulePreference( value : unknown ) : ModulePreference {
	if( typeof value !== "string" || value.trim().length === 0 ) {
		return "auto";
	}
	const normalized = value.trim().toLowerCase();
	if( normalized === "auto" || normalized === "module" || normalized === "commonjs" ) {
		return normalized;
	}
	throw new Error( `Unknown module preference "${ value }". Expected one of: auto, module, commonjs.` );
}

async function ensurePackageJson() {
	console.info( "Configuring package.json..." );

	const packagePath = "package.json";
	const existed = await fileExists( packagePath );
	if( !existed ) {
		console.info( "package.json does not exist. Creating one in the directory..." );
		await execa( "npm", [ "init", "-y" ], { stdio: "inherit" } );
	}

	const packageJson = JSON.parse( await readFile( packagePath, "utf8" ) ) as DraftPackageJson;
	return { packageJson, created: !existed };
}

function determineModuleScheme( preference : ModulePreference, packageJson : DraftPackageJson, created : boolean ) : ModuleScheme {
	if( preference === "module" ) {
		return "module";
	}

	if( preference === "commonjs" ) {
		return "commonjs";
	}

	if( created ) {
		return "module";
	}

	if( packageJson.type === "module" ) {
		return "module";
	}

	if( packageJson.type === "commonjs" ) {
		return "commonjs";
	}

	const exportCandidates : Array<unknown> = [];

	if( typeof packageJson.module === "string" ) {
		exportCandidates.push( packageJson.module );
	}

	if( typeof packageJson.main === "string" ) {
		exportCandidates.push( packageJson.main );
	}

	const rawExports = packageJson.exports;
	if( typeof rawExports === "string" ) {
		exportCandidates.push( rawExports );
	}
	else if( rawExports && typeof rawExports === "object" ) {
		exportCandidates.push( ...Object.values( rawExports ) );
	}

	for( const candidate of exportCandidates ) {
		if( typeof candidate === "string" && candidate.endsWith( ".mjs" ) ) {
			return "module";
		}
		if( candidate && typeof candidate === "object" ) {
			const candidateRecord = candidate as Record<string, unknown>;
			if( "import" in candidateRecord ) {
				return "module";
			}
		}
	}

	return "commonjs";
}

function ensureScripts( packageJson : DraftPackageJson ) {
	console.info( "Ensuring package.json scripts..." );
	packageJson.scripts ??= {};

	if( !packageJson.scripts[ "build" ] ) {
		packageJson.scripts[ "build" ] = "tsc";
	}
	if( !packageJson.scripts[ "clean" ] ) {
		packageJson.scripts[ "clean" ] = "rimraf ./build/";
	}
	if( !packageJson.scripts[ "lint" ] ) {
		packageJson.scripts[ "lint" ] = "eslint .";
	}
	if( !packageJson.scripts[ "start" ] ) {
		packageJson.scripts[ "start" ] = "npm run build && node build/index.js";
	}
	if( !packageJson.scripts[ "test" ] ) {
		packageJson.scripts[ "test" ] = "jest";
	}
}

function ensureDevDependencies( packageJson : DraftPackageJson ) {
	console.info( "Ensuring package.json devDependencies..." );
	packageJson.devDependencies ??= {};
	const sourceDeps = comfyPackage?.devDependencies ?? {};
	const dependencies = [
		"@types/jest",
		"@types/node",
		"@typescript-eslint/eslint-plugin",
		"@typescript-eslint/parser",
		"eslint",
		"eslint-config-comfycase",
		"jest",
		"rimraf",
		"typescript",
	] as const;

	for( const dependency of dependencies ) {
		if( packageJson.devDependencies[ dependency ] ) {
			continue;
		}
		const version = sourceDeps[ dependency ];
		if( typeof version === "string" ) {
			packageJson.devDependencies[ dependency ] = version;
		}
	}
}

function syncPackageType( packageJson : DraftPackageJson, scheme : ModuleScheme, preference : ModulePreference, created : boolean ) {
	const shouldSync = preference !== "auto" || created;
	if( !shouldSync ) {
		return;
	}

	if( scheme === "module" ) {
		if( packageJson.type !== "module" ) {
			console.info( "Setting package.json type to \"module\"." );
			packageJson.type = "module";
		}
		return;
	}

	if( packageJson.type === "module" ) {
		console.info( "Detected CommonJS preference; removing \"type\" field." );
		delete packageJson.type;
	}
}

async function writePackageJson( packageJson : DraftPackageJson ) {
	await writeFile( "package.json", `${ JSON.stringify( packageJson, null, 2 ) }\n` );
}

function buildTsconfig( scheme : ModuleScheme ) {
	const moduleSetting = scheme === "module" ? "NodeNext" : "CommonJS";
	const moduleResolution = scheme === "module" ? "NodeNext" : "Node";

	return {
		compilerOptions: {
			outDir: "./build",
			rootDir: "./src",
			sourceMap: true,
			declaration: true,
			declarationMap: true,
			strict: true,
			target: "ES2022",
			lib: [ "ES2022", "DOM" ],
			module: moduleSetting,
			moduleResolution,
			moduleDetection: "force",
			allowSyntheticDefaultImports: true,
			resolveJsonModule: true,
			esModuleInterop: true,
			isolatedModules: true,
			skipLibCheck: true,
			noEmitOnError: true,
			types: [ "node" ],
		},
		include: [
			"./src/**/*",
		],
		exclude: [
			"node_modules",
			"build",
		],
	};
}

async function writeTsconfigJson( scheme : ModuleScheme ) {
	console.info( "Writing tsconfig.json..." );
	const tsconfig = buildTsconfig( scheme );
	await writeFile( "tsconfig.json", `${ JSON.stringify( tsconfig, null, 2 ) }\n` );
}

async function writeEslintConfig( scheme : ModuleScheme ) {
	console.info( "Writing eslint.config.js..." );
	const globalsBlock = scheme === "commonjs"
		? `\t\t\t...globals.browser,\n\t\t\t...globals.node,\n\t\t\t...globals.es2021,\n\t\t\t...globals.commonjs,\n`
		: `\t\t\t...globals.browser,\n\t\t\t...globals.node,\n\t\t\t...globals.es2021,\n`;

	const eslintConfig = `import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const compat = new FlatCompat( {
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
} );

export default [
	...compat.extends( "comfycase" ),
	{
		ignores: [ "build/**", "dist/**" ],
	},
	{
		files: [ "**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}" ],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
			},
			globals: {
${ globalsBlock }			},
		},
		plugins: {
			"@typescript-eslint": typescriptPlugin,
		},
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [ "warn" ],
		},
	},
];
`;

	await writeFile( "eslint.config.js", eslintConfig );
}

async function writeEditorConfig() {
	console.info( "Writing .editorconfig..." );
	const editorConfig =
`root = true

[*]
indent_style = tab
indent_size = 4
charset = utf-8
end_of_line = lf
insert_final_newline = true
`;
	await writeFile( ".editorconfig", editorConfig );
}

async function ensureSourceLayout() {
	if( !( await fileExists( "src" ) ) ) {
		console.info( "Creating src directory..." );
		await mkdir( "src", { recursive: true } );
	}

	const entryPoint = path.join( "src", "index.ts" );
	if( !( await fileExists( entryPoint ) ) ) {
		console.info( "Creating src/index.ts starter file..." );
		await writeFile( entryPoint, "console.log( \"Hello Comfy World!\" );\n" );
	}
}

async function ensureGitignore() {
	const gitignorePath = ".gitignore";
	const buildPatterns = new Set( [ "/build", "build/", "build" ] );

	if( await fileExists( gitignorePath ) ) {
		const current = await readFile( gitignorePath, "utf8" );
		const lines = current.split( /\r?\n/ ).map( ( line ) => line.trim() );
		const hasBuildIgnore = lines.some( ( line ) => buildPatterns.has( line ) );
		if( hasBuildIgnore ) {
			return;
		}
		const suffix = current.endsWith( "\n" ) ? "" : "\n";
		await writeFile( gitignorePath, `${ current }${ suffix }/build\n` );
		return;
	}

	await writeFile( gitignorePath, "node_modules/\n/build\n" );
}

async function configureProject( command : ComfyTypeCommands, preference : ModulePreference ) {
	switch( command ) {
	case ComfyTypeCommands.None:
	case ComfyTypeCommands.Init:
		console.info( "Configuring TypeScript project in this directory..." );
		{
			const { packageJson, created } = await ensurePackageJson();
			const moduleScheme = determineModuleScheme( preference, packageJson, created );
			console.info( `Using ${ moduleScheme === "module" ? "ES module" : "CommonJS" } output.` );
			ensureScripts( packageJson );
			ensureDevDependencies( packageJson );
			syncPackageType( packageJson, moduleScheme, preference, created );
			await writePackageJson( packageJson );
			await writeTsconfigJson( moduleScheme );
			await writeEslintConfig( moduleScheme );
			await writeEditorConfig();
			await ensureGitignore();
			await ensureSourceLayout();
			console.info( "Complete! 'npm install' and then 'npm start' to build and run" );
		}
		break;
	default:
		cli.showHelp();
		break;
	}
}

try {
	const command = cli.input[ 0 ] as ComfyTypeCommands || ComfyTypeCommands.None;
	const modulePreference = normalizeModulePreference( cli.flags.module );
	await configureProject( command, modulePreference );
}
catch ( error ) {
	console.error( error instanceof Error ? error.message : error );
	process.exitCode = 1;
}
