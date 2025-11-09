![npm](https://img.shields.io/npm/v/comfytype?style=flat-square) ![GitHub](https://img.shields.io/github/license/instafluff/comfytype?style=flat-square) [![](https://data.jsdelivr.com/v1/package/npm/comfytype/badge)](https://www.jsdelivr.com/package/npm/comfytype)

# ComfyType
Comfiest way to start a TypeScript project!

`npx comfytype`

ComfyType is a one-line `npx` command to configure or create a very simple starter Node.js project TypeScript to get you coding right away as quickly as possible with [ComfyCase](https://www.github.com/instafluff/ComfyCase) syntax style lint rules.

## Instafluff ##
> *Like these projects? The best way to support my open-source projects is by becoming a Comfy Sponsor on GitHub!*

> https://github.com/sponsors/instafluff

> *Come and hang out with us at the Comfiest Corner on Twitch!*

> https://twitch.tv/instafluff

# Instructions
Run `npx comfytype` in a new project directory or an existing Node.js project directory.

# What it does
This command will...
1. (If there is no `package.json` file) Create a new `package.json` file
2. Add TypeScript dependencies and relevant script commands to your `package.json` file without overwriting your existing scripts
3. Create the `tsconfig.json` file with settings that work out-of-the-box for both Node and Browser while matching the module system your project uses *(NOTE: You should update this file as needed for your project)*
4. Configure the project with ComfyCase ESLint settings and create a `.editorconfig` file to accompany it
5. (If there is no `/src` directory) Create a project folder structure with a "Hello World" one-line example

## Module systems made comfy

ComfyType automatically detects whether your project should emit CommonJS or modern ES modules. Fresh projects default to ESM, while existing projects keep their current style. You can always override the behaviour:

```bash
npx comfytype init --module=module     # Force ES modules
npx comfytype init --module=commonjs   # Force CommonJS
```