let arguments = process.argv;

if (arguments.length < 3) {
    throw "Bengular error: not enough arguments, use 'bengular help'";
}

function isHelp(string) {
    return string === "help" || string === "--help" || string === "-h";
}
const myFunctions = require("./my-functions");

arguments = arguments.slice(2);
if (isHelp(arguments[0])) {
    myFunctions.log("Usage: bengular <command>\n");
    myFunctions.log("bengular help\t\t\tShows this help menu");
    myFunctions.log("bengular <command> help\t\tShows options for the command");
    myFunctions.log("bengular build <options>\tBuilds");
    myFunctions.log("bengular dev\t\t\tStarts the dev server");
    myFunctions.log("bengular init\t\t\tInitializes a bengular project");
} else if (arguments[0] === "build") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        myFunctions.log("Usage: bengular build <options>\n");
        myFunctions.log("--prod \tBuilds for prod");
        myFunctions.log("--dev \tBuilds for dev (not implemented)");
    } else {
        //Build
        const build = require("./build");
        if (arguments.length === 1 || (arguments[1] !== "--prod" && arguments[1] !== "--dev")) {
            throw "Bengular error: builds need environment, see 'bengular build help'";
        } else {
            const environment = arguments[1] === "--prod" ? "prod" : "dev";
            //TODO: changedFile
            //TODO: verbose
            //TODO: bengular.json
            build.build({
                environment: environment,
                changedFile: null,
                verbose: false,
                pagesDirectory: "./src/pages/",
                eslintDirectory: "./src/",
                generatedDirectory: "./generated/",
                prodDirectory: "./docs/",
                componentsDirectory: "./src/components/"
            });
        }
    }
} else if (arguments[0] === "dev") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        myFunctions.log("Usage: bengular dev\n");
        myFunctions.log("No options added yet");
    } else {
        //Dev
        const build = require("./build");
        //TODO: verbose
        //TODO: bengular.json
        build.build({
            environment: "dev",
            changedFile: null,
            verbose: false,
            pagesDirectory: "./src/pages/",
            eslintDirectory: "./src/",
            generatedDirectory: "./generated/",
            prodDirectory: "./docs/",
            componentsDirectory: "./src/components/"
        }).then(() => {
            const dev = require("./dev");
            dev.dev();
        })


    }
} else if (arguments[0] === "init") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        myFunctions.log("Usage: bengular init\n");
        myFunctions.log("No options added yet");
    } else {
        //Init
        const init = require("./init");
        init.init();
    }
} else {
    throw "Bengular error: Unrecognized arguments, use 'bengular help'";
}