const myFunctions = require("./my-functions");
const colors = require("colors/safe");
const bengularPackageJson = require("../package.json");

function cli() {
    let arguments = process.argv;

    if (arguments.length < 3) {
        throw "Bengular error: not enough arguments, use 'bengular help'";
    }
    arguments = arguments.slice(2);

    if (help.rootCommand.includes(arguments[0])) {
        help.fn(arguments);
    } else if (init.rootCommand.includes(arguments[0])) {
        init.fn(arguments);
    } else if (version.rootCommand.includes(arguments[0])) {
        version.fn(arguments);
    } else if (dev.rootCommand.includes(arguments[0])) {
        dev.fn(arguments);
    } else if (build.rootCommand.includes(arguments[0])) {
        build.fn(arguments);
    } else {
        throw "Bengular error: Unrecognized arguments, use 'bengular help'";
    }
}

function isHelp(string) {
    return ["help", "-h", "--help"].includes(string);
}

function getBengularJson(arguments) {
    const fs = require("fs");
    const bengularJsonString = fs.readFileSync("./bengular.json", "utf8");
    const bengularJson = JSON.parse(bengularJsonString);
    if (!bengularJson.verbose) {
        for (let i = 0; i < arguments.length; i++) {
            if (arguments[i] === "--verbose") {
                bengularJson.verbose = true;
                break;
            }
        }
    }

    return {
        json: bengularJson,
        string: bengularJsonString
    };
}

const help = {
    rootCommand: ["help", "-h", "--help"],
    fn: function (arguments) {
        myFunctions.log("Usage: bengular <command>\n");
        myFunctions.log("bengular help\t\t\tShows this help menu");
        myFunctions.log("bengular version\t\tShows bengular version info");
        myFunctions.log("bengular init\t\t\tInitializes a bengular project");
        myFunctions.log("bengular <command> help\t\tShows options for the command");
        myFunctions.log("bengular build <options>\tBuilds");
        myFunctions.log("bengular dev <options>\t\tStarts the dev server");
    }
};

const init = {
    rootCommand: ["init"],
    fn: function (arguments) {
        if (arguments.length >= 2 && isHelp(arguments[1])) {
            myFunctions.log("Usage: bengular init\n");
            myFunctions.log("No options added yet");
        } else {
            const initScript = require("./init");
            initScript.init();
        }
    }
};

const version = {
    rootCommand: ["version", "-v", "--version"],
    fn: function (arguments) {
        myFunctions.log(`Bengular v${bengularPackageJson.version}`);
    }
};

const dev = {
    rootCommand: ["dev"],
    fn: function (arguments) {
        const bengularJson = getBengularJson(arguments);
        if (arguments.length >= 2 && isHelp(arguments[1])) {
            myFunctions.log("Usage: bengular dev <options>\n");
            myFunctions.log("--verbose \tTo have verbose logging");
        } else {
            const build = require("./build");
            bengularJson.json.buildOptions = {
                environment: "dev",
                changedFile: null
            };
            build.build(bengularJson.json).then((result) => {
                if (result !== 0) {
                    myFunctions.log("Initial build failed, won't start dev server", colors.red);
                } else {
                    //Need to update the bengular.json, to show latest version
                    const regex = new RegExp(/"bengularVersion": "v[0-9]*.[0-9]*.[0-9]*"/);
                    const newBengularJson = bengularJson.string.replace(regex, `"bengularVersion": "v${bengularPackageJson.version}"`)
                    const fs = require("fs");
                    fs.writeFileSync("./bengular.json", newBengularJson);
                    const devScript = require("./dev");
                    devScript.dev(bengularJson.json);
                }
            })
        }
    }
};

const build = {
    rootCommand: ["build"],
    fn: function (arguments) {
        const bengularJson = getBengularJson(arguments);
        if (arguments.length >= 2 && isHelp(arguments[1])) {
            myFunctions.log("Usage: bengular build <options>\n");
            myFunctions.log("--prod \t\tBuilds for prod");
            myFunctions.log("--dev \t\tBuilds for dev");
            myFunctions.log("--verbose \tTo have verbose logging");
        } else {
            const buildScript = require("./build");
            if (arguments.length === 1 || (arguments[1] !== "--prod" && arguments[1] !== "--dev")) {
                myFunctions.log("Bengular error: builds need environment, see 'bengular build help'", colors.red);
            } else {
                const environment = arguments[1] === "--prod" ? "prod" : "dev";
                bengularJson.json.buildOptions = {
                    environment: environment,
                    changedFile: null
                };
                buildScript.build(bengularJson.json);
            }
        }
    }
};

module.exports = {
    cli
};