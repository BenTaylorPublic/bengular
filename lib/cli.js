let arguments = process.argv;

if (arguments.length < 3) {
    throw "Bengular error: not enough arguments, use 'bengular help'";
}

function isHelp(string) {
    return string === "help" || string === "--help" || string === "-h";
}

arguments = arguments.slice(2);
if (isHelp(arguments[0])) {
    console.log("Usage: bengular <command>\n");
    console.log("bengular help\t\t\tShows this help menu");
    console.log("bengular <command> help\t\tShows options for the command");
    console.log("bengular build <options>\tBuilds");
    console.log("bengular dev\t\t\tStarts the dev server");
    console.log("bengular init\t\t\tInitializes a bengular project");
} else if (arguments[0] === "build") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        console.log("Usage: bengular build <options>\n");
        console.log("--prod \tBuilds for prod");
        console.log("--dev \tBuilds for prod");
    } else {
        //Build
        const build = require("./build");
        build.build({
            environment: "prod",
            changedFile: null,
            verbose: false,
            pagesDirectory: "./src/pages/",
            eslintDirectory: "./src/",
            generatedDirectory: "./generated/",
            prodDirectory: "./docs/",
            componentsDirectory: "./src/components/"
        });
    }
} else if (arguments[0] === "dev") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        console.log("Usage: bengular dev\n");
        console.log("No options added yet");
    } else {
        //Dev
    }
} else if (arguments[0] === "init") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        console.log("Usage: bengular init\n");
        console.log("No options added yet");
    } else {
        //Dev
    }
} else {
    throw "Bengular error: Unrecognized arguments, use 'bengular help'";
}