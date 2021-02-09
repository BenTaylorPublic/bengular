let fs = require("fs");
let http = require("http");
let lastBuild = new Date();

//Websocket
const {Server} = require("socket.io");
const socketio = new Server({
    path: "",
    serveClient: false,
});

async function handleRequest(req, res) {
    let result;
    try {
        result = fs.readFileSync(__dirname + "/generated/build" + req.url, 'utf8');
    } catch (e) {
        res.writeHead(404);
        res.end(JSON.stringify(e));
        return;
    }
    if (req.url.includes(".html")) {
        //Components replacement logic
        let toReplace = [];
        let fileNames = fs.readdirSync("./src/components/");
        for (let i = 0; i < fileNames.length; i++) {
            let componentName = fileNames[i].replace(".html", "");
            let data = fs.readFileSync("./src/components/" + fileNames[i], 'utf8');
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