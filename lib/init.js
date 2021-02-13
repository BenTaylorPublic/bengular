function init() {
    const fs = require("fs");

    const filesThatCantExist = ["./eslintrc", ".gitignore", "tsconfig.json"];
    const foldersThatCantExist = ["./src/", "./generated/", "./dist/"];

    for (let i = 0; i < filesThatCantExist.length; i++) {
        if (fs.existsSync(filesThatCantExist[i])) {
            console.log(`${filesThatCantExist[i]} file exists, cancelling`);
            return;
        }
    }
    for (let i = 0; i < foldersThatCantExist.length; i++) {
        if (fs.existsSync(foldersThatCantExist[i])) {
            console.log(`${foldersThatCantExist[i]} folder exists, cancelling`);
            return;
        }
    }


    fs.mkdirSync("./src/");
    fs.mkdirSync("./generated/");
    fs.mkdirSync("./docs/");
    fs.mkdirSync("./src/shared/");
    fs.mkdirSync("./src/components/");
    fs.mkdirSync("./src/styles/");
    fs.mkdirSync("./src/pages/");
    fs.mkdirSync("./src/pages/index/");

    fs.writeFileSync("./src/pages/index/index.ts",
        `import {ExampleService} from "../../shared/example-service";

class IndexView {

    public static initialize(): void {
        ExampleService.logHelloWorld();
    }
}

IndexView.initialize();`);

    fs.writeFileSync("./src/pages/index/index.html",
        `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Bengular</title>
    <meta charset="UTF-8">
    <link href="global-styles.css" rel="stylesheet" type="text/css">
    <link href="index.css" rel="stylesheet" type="text/css">
    <script defer src="shared.bundle.js"></script>
    <script defer src="index.bundle.js"></script>
</head>
<body>
<h1>Hello World!</h1>
<component data-name="example-component"></component>
</body>
</html>`);

    fs.writeFileSync("./src/pages/index/index.scss",
        `h1 {
    color: purple;
}`);

    fs.writeFileSync("./src/components/example-component.html", `
        <div>This is an example component</div>
    `);

    fs.writeFileSync("./src/shared/example-service.ts",
        `export class ExampleService {
    public static logHelloWorld(): void {
        console.log("Hello world!");
    }
}`);

    fs.writeFileSync("./src/styles/global-styles.scss",
        `body {
        background-color: black;
        color: white;      
}`);
    fs.writeFileSync("./.eslintrc",
        `{
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "sourceType": "module"
  },
  "plugins": [
    "eslint-plugin-import",
    "@typescript-eslint",
    "@typescript-eslint/tslint"
  ],
  "rules": {
    "@typescript-eslint/consistent-type-definitions": "error",
    "@typescript-eslint/dot-notation": "off",
    "@typescript-eslint/explicit-member-accessibility": [
      "off",
      {
        "accessibility": "explicit"
      }
    ],
    "@typescript-eslint/indent": "error",
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        "multiline": {
          "delimiter": "semi",
          "requireLast": true
        },
        "singleline": {
          "delimiter": "semi",
          "requireLast": false
        }
      }
    ],
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-shadow": [
      "error",
      {
        "hoist": "all"
      }
    ],
    "@typescript-eslint/no-unused-expressions": "error",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/quotes": [
      "error",
      "double"
    ],
    "@typescript-eslint/semi": [
      "error",
      "always"
    ],
    "@typescript-eslint/type-annotation-spacing": "error",
    "@typescript-eslint/unified-signatures": "error",
    "arrow-body-style": "off",
    "brace-style": [
      "error",
      "1tbs"
    ],
    "constructor-super": "error",
    "curly": "error",
    "eol-last": "off",
    "eqeqeq": [
      "error",
      "smart"
    ],
    "guard-for-in": "off",
    "id-blacklist": "off",
    "id-match": "off",
    "import/no-deprecated": "error",
    "max-len": [
      "off",
      {
        "code": 180
      }
    ],
    "no-bitwise": "error",
    "no-caller": "error",
    "no-console": "off",
    "no-debugger": "error",
    "no-empty": "off",
    "no-eval": "error",
    "no-fallthrough": "error",
    "no-new-wrappers": "off",
    "no-restricted-imports": [
      "error",
      "rxjs/Rx"
    ],
    "no-throw-literal": "error",
    "no-trailing-spaces": "error",
    "no-undef-init": "error",
    "no-underscore-dangle": "off",
    "no-unused-labels": "error",
    "no-var": "error",
    "prefer-const": "error",
    "radix": "error",
    "@typescript-eslint/tslint/config": [
      "error",
      {
        "rules": {
          "import-spacing": true,
          "typedef": [
            true,
            "call-signature",
            "property-declaration",
            "parameter"
          ],
          "whitespace": [
            true,
            "check-branch",
            "check-decl",
            "check-operator",
            "check-separator",
            "check-type"
          ]
        }
      }
    ]
  }
}`);

    fs.writeFileSync("./.gitignore",
        `.idea/
node_modules/
generated/
docs/`);

    fs.writeFileSync("./tsconfig.json",
        `{
    "compileOnSave": false,
    "compilerOptions": {
        "outDir": "./generated/tsc-dist/",
        "sourceMap": false,
        "declaration": false,
        "moduleResolution": "Node",
        "emitDecoratorMetadata": false,
        "experimentalDecorators": true,
        "lib": [
            "esnext",
            "dom"
        ],
        "baseUrl": "src/",
        "paths": {},
        "module": "commonjs",
        "strict": true,
        "noImplicitReturns": true,
        "allowSyntheticDefaultImports": true,
        "allowUnreachableCode": true,
        "noUnusedLocals": false,
        "target": "ES6",
        "incremental": true,
        "removeComments": true,
        "noUnusedParameters": false,
        "noImplicitThis": true,
        "noImplicitAny": true,
        "noEmitOnError": true,
        "strictNullChecks": true,
        "noFallthroughCasesInSwitch": true,
        "esModuleInterop": true
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules"
    ]
}`);

}

module.exports = {
    init
}