const myFunctions = require("./my-functions");
const colors = require("colors/safe");
const fs = require("fs");

const socketIoVersion = "4.0.0";
let latestBuildErrorOrNull = null;

async function dev(bengularJson) {
    getSocketIoIfNotThere();
    missingDirectoryFixes(bengularJson);
    fileWatcher(bengularJson);
    serve(bengularJson);
}

function missingDirectoryFixes(bengularJson) {
    //Just in case the directory is missing
    if (!fs.existsSync(bengularJson.componentsDirectory)) {
        fs.mkdirSync(bengularJson.componentsDirectory);
    }
}

function cleanUpErrorString(initialErrorString) {
    return initialErrorString
        //eslint
        .replaceAll(`✖`, "X")
        //sass
        .replaceAll(`╷`, "")
        .replaceAll(`│`, "")
        .replaceAll(`╵`, "")
        //Remove Coloring/Ansi Regex from https://stackoverflow.com/a/29497680/13316513
        //Can't seem to use 'strip-ansi' because this is still commonjs, not a module
        .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

function generateErrorPage(taskName, errorString) {
    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <script src=\"socket.io.js\"></script>
        <script defer>${myFunctions.getAutoRefreshScript()}</script>
    </head>
    <body style="background-color: black; color: white;">
        <h1 style="color: red;">Bengular build error</h1>
        <strong>Task: ${taskName}</strong>
        <br/>
        <strong>Error:</strong>
        <pre>${errorString}</pre>
    </body>
</html>`;
}

function getSocketIoIfNotThere() {
    if (!fs.existsSync(`./generated/socket-io-${socketIoVersion}.js`)) {

        const http = require("http");

        http.get(`http://cdnjs.cloudflare.com/ajax/libs/socket.io/${socketIoVersion}/socket.io.js`, (res) => {
            res.setEncoding("utf8");
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    fs.writeFileSync(`./generated/socket-io-${socketIoVersion}.js`, data);
                } catch (e) {
                }
            });
        }).on("error", (err) => {
        });
    }
}

async function fileWatcher(bengularJson) {
    const chokidar = require("chokidar");
    const watcher = chokidar.watch(bengularJson.srcDirectory, {ignoreInitial: true});
    const build = require("./build");

    function onAddChangeUnlink(path) {
        //Just in case it's on Windows
        path = path.replaceAll("\\", "/");
        bengularJson.buildOptions = {
            environment: "dev",
            changedFile: path
        };
        build.build(bengularJson);
    }

    watcher
        .on("add", onAddChangeUnlink)
        .on("change", onAddChangeUnlink)
        .on("unlink", onAddChangeUnlink) //unlink is delete
        .on("error", function (error) {
            const myFunctions = require("./my-functions");
            myFunctions.log("chokidar error: " + error);
        }).on("ready", () => {
        //This isn't the serve function
        //But this log is here, so that tests wont save files until the file watcher is active
        myFunctions.log(`Now serving at http://localhost:${bengularJson.port}`);
    });

}

async function serve(bengularJson) {
    let fs = require("fs");
    let http = require("http");

    //Websocket
    const {Server} = require("socket.io");
    const socketio = new Server({
        path: "",
        serveClient: false,
    });

    let server = http.createServer(function (req, res) {
        //Build finished, refresh via websockets
        if (req.url.includes("/refresh")) {
            // Must have successfully built. Refresh.
            latestBuildErrorOrNull = null;
            res.writeHead(200);
            res.end(null);
            const buildId = req.url.split("/").pop();
            socketio.sockets.emit("refresh", {
                buildId: buildId
            });
            return;
        }

        //Error page
        if (req.url.includes("/bengular-build-error")) {
            let data = "";
            let count = 0;
            req.on("data", chunk => {
                data += chunk;
                count++;
            })
            req.on("end", () => {
                // TODO: Work out why it's dropping the 2 last characters regardless of length
                // myFunctions.log(data, colors.blue);
                // myFunctions.log(`Content-Length: ${req.headers["content-length"]}`, colors.blue);
                // myFunctions.log(`Count: ${count}`, colors.blue);
                // myFunctions.log(`Length: ${data.length}`, colors.blue);
                if (!data.endsWith(`"}`)) {
                    data += `"}`;
                }
                const json = JSON.parse(data);
                if (json.error != null && json.taskName != null) {
                    latestBuildErrorOrNull = {
                        taskName: json.taskName,
                        errorString: cleanUpErrorString(json.error)
                    };
                }
                res.writeHead(200);
                res.end(null);
                socketio.sockets.emit("refresh", {
                    buildId: json.buildId
                });
            })
            return;
        }

        //Removing from route params onwards
        if (req.url.includes("?")) {
            req.url = req.url.substring(0, req.url.indexOf("?"));
        }
        //Headers
        if (req.url.includes(".js")) {
            res.setHeader("Content-Type", "text/javascript");
        } else if (req.url.includes(".css")) {
            res.setHeader("Content-Type", "text/css");
        }

        if (req.url === "/") {
            req.url = bengularJson.rootHtml;
        }

        if (bengularJson.hostedPath.length > 0 &&
            !req.url.startsWith(bengularJson.hostedPath) &&
            req.url !== "/socket.io.js") {
            myFunctions.log("404: " + req.url, colors.red);
            res.writeHead(404);
            res.end();
            return;
        }

        req.url = req.url.replace(bengularJson.hostedPath, "");
        if (req.url.length === 0 ||
            req.url[0] !== "/") {
            req.url = "/" + req.url;
        }

        let result;
        let fileFound = false;
        let exception = null;
        try {
            let path;
            if (req.url === `/socket.io.js`) {
                path = `${bengularJson.generatedDirectory}/socket-io-${socketIoVersion}.js`;
            } else {
                path = `${bengularJson.generatedDirectory}/build${req.url}`;
            }

            if (fs.existsSync(path)) {
                result = fs.readFileSync(path, "utf8");
                fileFound = true;
            } else if (req.url.includes("/assets/")) {
                path = req.url.replace("/assets/", bengularJson.assetsDirectory);
                if (fs.existsSync(path)) {
                    result = fs.readFileSync(path);
                    fileFound = true;
                }
            } else if (!req.url.includes(".")) {
                if (fs.existsSync(path + ".html")) {
                    result = fs.readFileSync(path + ".html", "utf8");
                    fileFound = true;
                }
            }
        } catch (e) {
            exception = e;
        }

        if (!fileFound || exception != null) {
            myFunctions.log("404: " + req.url, colors.red);
            res.writeHead(404);
            res.end(JSON.stringify(exception));
            return;
        }

        if (req.url.includes(".html") || !req.url.includes(".")) {
            if (latestBuildErrorOrNull != null) {
                //Need to show the error page
                result = generateErrorPage(latestBuildErrorOrNull.taskName, latestBuildErrorOrNull.errorString);

                res.writeHead(200);
                res.end(result);
                return;
            }

            //Components replacement logic
            let toReplace = [];
            let fileNames = fs.readdirSync(bengularJson.componentsDirectory);
            for (let i = 0; i < fileNames.length; i++) {
                let componentName = fileNames[i].replace(".html", "");
                let data = fs.readFileSync(bengularJson.componentsDirectory + fileNames[i], "utf8");
                toReplace.push({
                    search: "<component data-name=\"" + componentName + "\"></component>",
                    replace: data
                });
            }

            toReplace.push({
                search: "<head>",
                replace: "<head><script src=\"socket.io.js\"></script>"
            })
            for (let j = 0; j < toReplace.length; j++) {
                result = result.replaceAll(toReplace[j].search, toReplace[j].replace);
            }
        }
        res.writeHead(200);
        res.end(result);
    });

    socketio.attach(server);

    server.listen(bengularJson.port);
}

module.exports = {
    dev
};