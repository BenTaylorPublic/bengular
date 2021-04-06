let arguments = process.argv;

if (arguments.length < 3) {
    throw "Bengular error: not enough arguments, use 'bengular help'";
}

function isHelp(string) {
    return ["help", "-h", "--help"].includes(string);
}

const myFunctions = require("./my-functions");
const colors = require("colors/safe");

arguments = arguments.slice(2);
if (isHelp(arguments[0])) {
    myFunctions.log("Usage: bengular <command>\n");
    myFunctions.log("bengular help\t\t\tShows this help menu");
    myFunctions.log("bengular version\t\tShows bengular version info");
    myFunctions.log("bengular init\t\t\tInitializes a bengular project");
    myFunctions.log("bengular <command> help\t\tShows options for the command");
    myFunctions.log("bengular build <options>\tBuilds");
    myFunctions.log("bengular dev <options>\t\tStarts the dev server");
} else if (arguments[0] === "init") {
    if (arguments.length >= 2 && isHelp(arguments[1])) {
        myFunctions.log("Usage: bengular init\n");
        myFunctions.log("No options added yet");
    } else {
        //Init
        const init = require("./init");
        init.init();
    }
} else if (["version", "-v", "--version"].includes(arguments[0])) {
    const pjson = require("../package.json");
    myFunctions.log(`Bengular v${pjson.version}`);
} else {
    //Not help init or version, so we should have bengular JSON setup
    const fs = require("fs");
    const bengularJson = JSON.parse(fs.readFileSync("./bengular.json"));
    if (!bengularJson.verbose) {
        for (let i = 0; i < arguments.length; i++) {
            if (arguments[i] === "--verbose") {
                bengularJson.verbose = true;
                break;
            }
        }
    }

    if (arguments[0] === "build") {
        if (arguments.length >= 2 && isHelp(arguments[1])) {
            myFunctions.log("Usage: bengular build <options>\n");
            myFunctions.log("--prod \t\tBuilds for prod");
            myFunctions.log("--dev \t\tBuilds for dev");
            myFunctions.log("--verbose \tTo have verbose logging");
        } else {
            //Build
            const build = require("./build");
            if (arguments.length === 1 || (arguments[1] !== "--prod" && arguments[1] !== "--dev")) {
                throw "Bengular error: builds need environment, see 'bengular build help'";
            } else {
                const environment = arguments[1] === "--prod" ? "prod" : "dev";
                bengularJson.buildOptions = {
                    environment: environment,
                    changedFile: null
                };
                build.build(bengularJson);
            }
        }
    } else if (arguments[0] === "dev") {
        if (arguments.length >= 2 && isHelp(arguments[1])) {
            myFunctions.log("Usage: bengular dev <options>\n");
            myFunctions.log("--verbose \tTo have verbose logging");
        } else {
            //Dev
            const build = require("./build");
            bengularJson.buildOptions = {
                environment: "dev",
                changedFile: null
            };
            build.build(bengularJson).then((result) => {
                if (result !== 0) {
                    myFunctions.log("Initial build failed, won't start dev server", colors.red);
                } else {
                    const dev = require("./dev");
                    dev.dev(bengularJson);
                }
            })


        }
    } else {
        throw "Bengular error: Unrecognized arguments, use 'bengular help'";
    }
}