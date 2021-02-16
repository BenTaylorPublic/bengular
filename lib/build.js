const colors = require("colors/safe");

async function build(bengularOptions) {
    let buildStartTime = new Date();
    const myFunctions = require("./my-functions");
    const options = getBuildOptions();
    if (typeof options === "string") {
        myFunctions.log("Bad arguments");
        myFunctions.log(options);
        throw options;
    }
    const buildId = Buffer.from(buildStartTime.toUTCString()).toString("base64");
    myFunctions.log(`Build id: ${buildId}`);

    const {spawnSync} = require("child_process");
    const fs = require("fs");
    const promisify = require("util").promisify;

    let allTasks = [];

    allTasks.push({
        name: "eslint",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "module ts" ||
                buildOptions.devBuildType === "all ts";
        },
        fn: async function (buildOptions) {
            return myFunctions.eslint(buildOptions, spawnSync, bengularOptions);
        }
    });

    allTasks.push({
        name: "cleaning docs",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod";
        },
        fn: async function (buildOptions) {
            fs.rmSync("./docs/", {recursive: true, force: true});
            fs.mkdirSync("./docs/");
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning generated ts",
        willRun: function (buildOptions) {
            return buildOptions.environment === "dev" &&
                (buildOptions.devBuildType === "all" ||
                    buildOptions.devBuildType === "all ts");
        },
        fn: async function (buildOptions) {
            const tsFiles = myFunctions.getFiles(bengularOptions.generatedDirectory, "ts");
            for (let i = 0; i < tsFiles.length; i++) {
                fs.rmSync(tsFiles[i].path);
            }
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning generated html",
        willRun: function (buildOptions) {
            return buildOptions.environment === "dev" &&
                (buildOptions.devBuildType === "all" ||
                    buildOptions.devBuildType === "all html");
        },
        fn: async function (buildOptions) {
            const htmlFiles = myFunctions.getFiles(bengularOptions.generatedDirectory, "html");
            for (let i = 0; i < htmlFiles.length; i++) {
                fs.rmSync(htmlFiles[i].path);
            }
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning generated scss",
        willRun: function (buildOptions) {
            return buildOptions.environment === "dev" &&
                (buildOptions.devBuildType === "all" ||
                    buildOptions.devBuildType === "all scss");
        },
        fn: async function (buildOptions) {
            const scssFiles = myFunctions.getFiles(bengularOptions.generatedDirectory, "scss");
            for (let i = 0; i < scssFiles.length; i++) {
                fs.rmSync(scssFiles[i].path);
            }
            return 0;
        }
    });

    allTasks.push({
        name: "generating on page loads",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "all ts";
        },
        fn: async function (buildOptions) {


            const generatedDirectory = bengularOptions.generatedDirectory + "page-loads/";

            if (!fs.existsSync(generatedDirectory)) {
                fs.mkdirSync(generatedDirectory);
            }

            fs.writeFileSync(generatedDirectory + "on-page-load-prod.js", "");

            const onPageLoadDev = `
            const socket = io.connect("http://localhost:8080");
            socket.on("refresh", () => {
                location.reload();
            });
        `;
            fs.writeFileSync(generatedDirectory + "on-page-load-dev.js", onPageLoadDev);

            return 0;
        }
    });

    allTasks.push({
        name: "tsc",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "module ts" ||
                buildOptions.devBuildType === "all ts";
        },
        fn: async function (buildOptions) {
            let tscResult = spawnSync(
                "node",
                ["node_modules/typescript/lib/tsc.js",
                    "--build"
                ],
                {
                    encoding: "utf8",
                    cwd: "./"
                });

            if (tscResult.status !== 0) {
                myFunctions.log(" ERROR", colors.red);
                myFunctions.log(tscResult.stdout, colors.red);
                return 1;
            }
            return 0;
        }
    });


    allTasks.push({
        name: "bundle module",
        willRun: function (buildOptions) {
            return buildOptions.environment === "dev" &&
                buildOptions.devBuildType === "module ts";
        },
        fn: async function (buildOptions) {
            const module = {
                name: buildOptions.devBuildModule,
                entryDir: `${buildOptions.devBuildModule}/`
            };
            const outDir = bengularOptions.generatedDirectory + "build/";
            const shared = myFunctions.getShared();
            await myFunctions.bundle(module.name, module.entryDir, outDir, shared, bengularOptions);
            return 0;
        }
    });

    allTasks.push({
        name: "bundle all",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "all ts";
        },
        fn: async function (buildOptions) {

            if (!fs.existsSync(bengularOptions.generatedDirectory + "build/")) {
                fs.mkdirSync(bengularOptions.generatedDirectory + "build/");
            }
            const htmlFiles = myFunctions.getFiles(bengularOptions.pagesDirectory, "html");
            const bundles = [];
            for (let i = 0; i < htmlFiles.length; i++) {
                const moduleName = htmlFiles[i].filename.replace(".html", "");
                bundles.push({
                    name: moduleName,
                    entryDir: moduleName + "/"
                });
            }

            let outDir = "";
            if (buildOptions.environment === "prod") {
                outDir = bengularOptions.prodDirectory;
            } else {
                outDir = bengularOptions.generatedDirectory + "build/";
            }

            const browserify = require("browserify");
            const shared = myFunctions.getShared();
            for (const bundle of bundles) {
                await myFunctions.bundle(bundle.name, bundle.entryDir, outDir, shared, bengularOptions);
            }

            //Doing the shared bundle now
            let b = browserify();
            for (const sharedJs of shared) {
                b.require(bengularOptions.generatedDirectory + "tsc-dist/shared/" + sharedJs.entryDir + sharedJs.name + ".js", {
                    expose: "./shared/" + sharedJs.entryDir + sharedJs.name
                });
            }

            const buffer = await promisify(b.bundle.bind(b))();
            let bundleAsString = buffer.toString();
            bundleAsString += fs.readFileSync(bengularOptions.generatedDirectory + "page-loads/on-page-load-" + buildOptions.environment + ".js", "utf8");
            fs.writeFileSync("./" + outDir + "shared.bundle.js", bundleAsString);

            return 0;
        }
    });

    allTasks.push({
        name: "sass",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "module scss" ||
                buildOptions.devBuildType === "all scss";
        },
        fn: async function (buildOptions) {
            if (!fs.existsSync(bengularOptions.generatedDirectory + "scss/")) {
                fs.mkdirSync(bengularOptions.generatedDirectory + "scss/");
            }
            let sassResult = spawnSync(
                "node",
                ["node_modules/sass/sass.js",
                    "src/:" + bengularOptions.generatedDirectory + "scss/",
                    "--style=compressed",
                    "--no-source-map"],
                {
                    encoding: "utf8",
                    cwd: "./"
                });

            if (sassResult.status !== 0) {
                myFunctions.log(" ERROR", colors.red);
                myFunctions.log(sassResult.stderr, colors.red);
                return 1;
            }
            let cssFiles = myFunctions.getFiles(bengularOptions.generatedDirectory + "scss/", "css");
            myFunctions.copyButFlatten(cssFiles, bengularOptions.generatedDirectory + "build/");

            return 0;
        }
    });

    allTasks.push({
        name: "copy css",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "module scss" ||
                buildOptions.devBuildType === "all scss";
        },
        fn: async function (buildOptions) {
            let cssFiles = myFunctions.getFiles(bengularOptions.generatedDirectory + "scss/", "css");
            const dest = buildOptions.environment === "prod" ? "./docs/" : bengularOptions.generatedDirectory + "build/";
            myFunctions.copyButFlatten(cssFiles, dest);
            return 0;
        }
    });

    allTasks.push({
        name: "copy html",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                buildOptions.devBuildType === "all" ||
                buildOptions.devBuildType === "module html" ||
                buildOptions.devBuildType === "all html";
        },
        fn: async function (buildOptions) {
            let htmlFiles = myFunctions.getFiles("./src/", "html", [bengularOptions.componentsDirectory]);
            const dest = buildOptions.environment === "prod" ? "./docs/" : bengularOptions.generatedDirectory + "build/";
            myFunctions.copyButFlatten(htmlFiles, dest);
            return 0;
        }
    });

    allTasks.push({
        name: "copy assets",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod";
        },
        fn: async function (buildOptions) {
            if (!fs.existsSync("./src/assets/")) {
                fs.mkdirSync("./src/assets/");
            }
            let assetsFiles = myFunctions.getFiles("./src/assets/", "*");
            for (let i = 0; i < assetsFiles.length; i++) {
                const assetFile = assetsFiles[i];
                fs.copyFileSync(assetFile.path, assetFile.path.replace("./src/", "./docs/"));
            }
            return 0;
        }
    });


    allTasks.push({
        name: "inserting components",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod";
        },
        fn: async function (buildOptions) {
            let toReplace = [];

            const componentFileNames = fs.readdirSync(bengularOptions.componentsDirectory);
            for (let i = 0; i < componentFileNames.length; i++) {
                let componentName = componentFileNames[i].replace(".html", "");
                let component = fs.readFileSync(bengularOptions.componentsDirectory + componentFileNames[i], "utf8");
                toReplace.push({
                    search: "<component data-name=\"" + componentName + "\"></component>",
                    replace: component
                });
            }

            const docsFileNames = fs.readdirSync("./docs/");
            for (let i = 0; i < docsFileNames.length; i++) {
                let docFilePath = "./docs/" + docsFileNames[i];
                if (!docFilePath.includes(".html")) {
                    continue;
                }
                let html = fs.readFileSync(docFilePath, "utf8");
                for (let j = 0; j < toReplace.length; j++) {
                    html = html.replace(toReplace[j].search, toReplace[j].replace);
                }
                fs.writeFileSync(docFilePath, html, "utf8");
            }

            return 0;
        }
    });

    allTasks.push({
        name: "minify html",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod";
        },
        fn: async function (buildOptions) {
            const minify = require("html-minifier").minify;
            const minifyOptions = {
                removeComments: true,
                collapseWhitespace: true
            };

            const htmlFiles = myFunctions.getFiles("./docs/", "html")
            for (let i = 0; i < htmlFiles.length; i++) {
                const docFilePath = htmlFiles[i].path;
                const html = fs.readFileSync(docFilePath, "utf8");
                const minifiedHtml = minify(html, minifyOptions);
                fs.writeFileSync(docFilePath, minifiedHtml, "utf8");
            }
            return 0;
        }
    });

    allTasks.push({
        name: "minify js",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod";
        },
        fn: async function (buildOptions) {
            const UglifyES = require("uglify-es");
            const jsFiles = myFunctions.getFiles("./docs/", "js")
            for (let i = 0; i < jsFiles.length; i++) {
                const docFilePath = jsFiles[i].path;
                const js = fs.readFileSync(docFilePath, "utf8");
                const result = UglifyES.minify(js);
                if (result.error != null) {
                    myFunctions.log(` ERROR\nMinifying bundle ${docFilePath}`, colors.red);
                    myFunctions.log(result.error, colors.red);
                    return 1;
                }
                fs.writeFileSync(docFilePath, result.code, "utf8");
            }
            return 0;
        }
    });

    allTasks.push({
        name: "refresh",
        willRun: function (buildOptions) {
            return buildOptions.environment === "dev";
        },
        fn: async function (buildOptions) {
            const http = require("http");

            http.get(`http://localhost:8080/refresh/${buildId}`, (resp) => {
            }).on("error", (err) => {
            });

            return 0;

        }
    });

    function getBuildOptions() {
        const result = {
            buildOptions: {
                //prod or dev
                environment: "",
                //all, module html, module scss, module ts, all html, all scss, all ts
                devBuildType: "all",
                //Module name, if devBuildType is set to module html, module scss, or module ts
                devBuildModule: "",
            },
            //true or false
            verbose: false
        };
        if (bengularOptions.buildOptions.environment === "prod") {
            result.buildOptions.environment = "prod";
            myFunctions.log(`Build type: prod`);
        } else if (bengularOptions.buildOptions.environment === "dev") {
            result.buildOptions.environment = "dev";
            if (bengularOptions.buildOptions.changedFile != null) {
                //It's a grunt watch reload, so choose the correct file type
                const filepath = bengularOptions.buildOptions.changedFile;
                const extension = filepath.split(".").pop().toLowerCase();
                if (filepath.includes("/pages/")) {
                    //Module
                    result.buildOptions.devBuildType = `module ${extension}`;
                    result.buildOptions.devBuildModule = myFunctions.getModuleFromFilepath(filepath);
                    myFunctions.log(`Build type: dev ${result.buildOptions.devBuildType}, module: ${result.buildOptions.devBuildModule}`);
                } else {
                    //All
                    result.buildOptions.devBuildType = `all ${extension}`;
                    myFunctions.log(`Build type: dev ${result.buildOptions.devBuildType}`);
                }
            }
            if (result.buildOptions.devBuildType === "all") {
                myFunctions.log(`Build type: dev`);
            }
        }

        result.verbose = bengularOptions.verbose;

        return result;
    }

    /*
     * RUNNING TASKS
     */

    async function runTasks() {
        const tasksToRun = [];
        if (options.verbose) {
            myFunctions.log("Tasks:");
        }
        for (let i = 0; i < allTasks.length; i++) {
            const task = allTasks[i];
            const taskWillRun = task.willRun(options.buildOptions);
            if (taskWillRun) {
                tasksToRun.push(task);
            }
            if (options.verbose) {
                myFunctions.log(`${taskWillRun ? "+" : "-"} ${task.name}`);
            }
        }

        const amountOfTasks = tasksToRun.length;
        let tasksDone = 0;
        for (let i = 0; i < tasksToRun.length; i++) {
            const task = tasksToRun[i];
            if (!options.verbose) {
                myFunctions.clearLine();
                process.stdout.write(`${myFunctions.getBar(tasksDone, amountOfTasks)} ${task.name}...`);
            } else {
                //Verbose
                myFunctions.log(`${myFunctions.getBar(tasksDone, amountOfTasks)}: ${task.name}`);
            }
            let taskStartTime = new Date();
            let taskResult;
            try {
                taskResult = await task.fn(options.buildOptions);
            } catch (e) {
                taskResult = e;
            }
            if (options.verbose) {
                const seconds = myFunctions.secondsSince(taskStartTime);
                myFunctions.log(`duration: ${seconds}s`);
                if (taskResult === 0) {
                    myFunctions.log(`result: ${taskResult}`);
                }
            }
            if (taskResult !== 0) {
                return 1;
            }
            tasksDone = myFunctions.endTask(tasksDone);
        }

        const seconds = myFunctions.secondsSince(buildStartTime);
        myFunctions.clearLine();
        myFunctions.log(`${myFunctions.getBar(tasksDone, amountOfTasks)} Built in ${seconds}s`);
        return 0;
    }

    return await runTasks();
}

module.exports = {
    build
};