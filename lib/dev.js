const myFunctions = require("./my-functions");
const colors = require("colors/safe");

async function dev(bengularJson) {
    fileWatcher(bengularJson);
    serve(bengularJson);
    myFunctions.log("Now serving at http://localhost:8080");
}

async function fileWatcher(bengularJson) {
    const chokidar = require("chokidar");
    const watcher = chokidar.watch(bengularJson.srcDirectory, {ignoreInitial: true});
    const build = require("./build");

    function onAddChangeUnlink(path) {
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
        });
}

async function serve(bengularJson) {
    let fs = require("fs");
    let http = require("http");
    let lastBuild = new Date();

    //Websocket
    const {Server} = require("socket.io");
    const socketio = new Server({
        path: "",
        serveClient: false,
    });

    function handleRequest(req, res) {
        let result;
        let fileFound = false;
        let exception = null;
        try {
            let path = bengularJson.generatedDirectory + "/build" + req.url;

            if (fs.existsSync(path)) {
                result = fs.readFileSync(path, "utf8");
                fileFound = true;
            } else if (req.url.includes("/assets/")) {
                path = req.url.replace("/assets/", bengularJson.assetsDirectory);
                if (fs.existsSync(path)) {
                    result = fs.readFileSync(path);
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

        if (req.url.includes(".html")) {
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
                replace: "<head><script src=\"https://cdnjs.cloudflare.com/ajax/libs/socket.io/3.1.0/socket.io.js\"></script>"
            })
            for (let j = 0; j < toReplace.length; j++) {
                result = result.replace(toReplace[j].search, toReplace[j].replace);
            }
        }
        res.writeHead(200);
        res.end(result);
    }

    let server = http.createServer(function (req, res) {
        //Build finished, refresh via websockets
        if (req.url.includes("/refresh")) {
            res.writeHead(200);
            res.end(null);
            const buildId = req.url.split("/").pop();
            socketio.sockets.emit("refresh", {
                buildId: buildId
            });
            lastBuild = new Date();
            return;
        }

        //Removing from route params onwards
        if (req.url.includes("?")) {
            req.url = req.url.substring(0, req.url.indexOf("?"));
        }
        if (req.url.includes(".js")) {
            res.setHeader("Content-Type", "text/javascript");
        }

        handleRequest(req, res);
    });

    socketio.attach(server);

    server.listen(8080);
}

module.exports = {
    dev
};