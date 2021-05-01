const myFunctions = require("./my-functions");
const colors = require("colors/safe");
const fs = require("fs");
const bengularPackageJson = require("../package.json");

function cli() {
    const allRootCommands = [...help.rootCommands, ...init.rootCommands, ...version.rootCommands, ...dev.rootCommands, ...build.rootCommands];
    let arguments = [];
    for (let i = 0; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (allRootCommands.includes(arg)) {
            //Slice from here
            arguments = process.argv.slice(i);
            break;
        }
    }

    if (arguments.length === 0) {
        myFunctions.log("Bengular error: invalid arguments, use 'bengular help'", colors.red);
        return;
    }

    if (help.rootCommands.includes(arguments[0])) {
        help.fn(arguments);
    } else if (init.rootCommands.includes(arguments[0])) {
        init.fn(arguments);
    } else if (version.rootCommands.includes(arguments[0])) {
        version.fn(arguments);
    } else if (dev.rootCommands.includes(arguments[0])) {
        dev.fn(arguments);
    } else if (build.rootCommands.includes(arguments[0])) {
        build.fn(arguments);
    } else {
        myFunctions.log("Bengular error: invalid arguments, use 'bengular help'", colors.red);
    }
}

function isHelp(string) {
    return ["help", "-h", "--help"].includes(string);
}

function getBengularJson(arguments) {
    if (!fs.existsSync("./bengular.json")) {
        myFunctions.log("bengular.json not found. Please check if you're in the correct directory.", colors.red);
        return null;
    }

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
    rootCommands: ["help", "-h", "--help"],
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
    rootCommands: ["init"],
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
    rootCommands: ["version", "-v", "--version"],
    fn: function (arguments) {
        myFunctions.log(`Bengular v${bengularPackageJson.version}`);
    }
};

const dev = {
    rootCommands: ["dev"],
    fn: function (arguments) {
        const bengularJson = getBengularJson(arguments);
        if (bengularJson == null) {
            return;
        }
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

                    fs.writeFileSync("./bengular.json", newBengularJson);
                    //Begin dev server
                    const devScript = require("./dev");
                    devScript.dev(bengularJson.json);
                }
            })
        }
    }
};

const build = {
    rootCommands: ["build"],
    fn: function (arguments) {
        const bengularJson = getBengularJson(arguments);
        if (bengularJson == null) {
            return;
        }
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