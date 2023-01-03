#!/usr/bin/env node
import meow from "meow";
import * as fs from "fs";
export var ComfyTypeCommands;
(function (ComfyTypeCommands) {
    ComfyTypeCommands["Init"] = "init";
})(ComfyTypeCommands || (ComfyTypeCommands = {}));
;
const cli = meow(`
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
});
const comfyPackage = cli.pkg;
function addScripts(packageJson) {
    // Ensure a scripts section
    if (!packageJson.scripts) {
        packageJson.scripts = {};
    }
    packageJson.scripts["start"] = "npm run build && node build/index.js";
    packageJson.scripts["build"] = "tsc";
    packageJson.scripts["clean"] = "rimraf ./build/";
    packageJson.scripts["test"] = "jest";
    packageJson.scripts["lint"] = "eslint . --ext .js,.ts";
}
function addDependencies(packageJson) {
    // Ensure a scripts section
    if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
    }
    if (comfyPackage?.devDependencies) {
        packageJson.devDependencies["@types/jest"] = comfyPackage.devDependencies["@types/jest"];
        packageJson.devDependencies["@typescript-eslint/eslint-plugin"] = comfyPackage.devDependencies["@typescript-eslint/eslint-plugin"];
        packageJson.devDependencies["@typescript-eslint/parser"] = comfyPackage.devDependencies["@typescript-eslint/parser"];
        packageJson.devDependencies["eslint"] = comfyPackage.devDependencies["eslint"];
        packageJson.devDependencies["eslint-config-comfycase"] = comfyPackage.devDependencies["eslint-config-comfycase"];
        packageJson.devDependencies["jest"] = comfyPackage.devDependencies["jest"];
        packageJson.devDependencies["rimraf"] = comfyPackage.devDependencies["rimraf"];
        packageJson.devDependencies["typescript"] = comfyPackage.devDependencies["typescript"];
    }
}
function saveOrUpdatePackageJson() {
    if (!fs.existsSync("package.json")) {
        // TODO: run npm init
    }
    const packageJson = JSON.parse(fs.readFileSync("package.json").toString());
    addScripts(packageJson);
    addDependencies(packageJson);
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "  ") + "\n");
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
            "@typescript-eslint/no-unused-vars": ["warn"],
        },
    };
    fs.writeFileSync(".eslintrc.json", JSON.stringify(eslintJson, null, "\t") + "\n");
}
function saveEditorConfig() {
    const editorConfig = `root = true
[*.ts]
indent_style = tab
indent_size = 4
charset = utf-8
end_of_line = lf
`;
    fs.writeFileSync(".editorconfig", editorConfig);
}
switch (cli.input[0]) {
    case "init":
        {
            try {
                saveOrUpdatePackageJson();
                saveEslintJson();
                saveEditorConfig();
            }
            catch (error) {
                console.error(error);
            }
        }
        break;
    default:
        cli.showHelp();
        break;
}
//# sourceMappingURL=index.js.map