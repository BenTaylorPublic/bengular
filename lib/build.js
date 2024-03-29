const colors = require("colors/safe");

async function build(bengularJson) {
    let buildStartTime = new Date();
    const myFunctions = require("./my-functions");
    const options = getBuildOptions();
    if (typeof options === "string") {
        myFunctions.log("Bad arguments");
        myFunctions.log(options);
        throw options;
    }
    const buildId = getBuildId(buildStartTime)
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
            let lintDirectory = bengularJson.srcDirectory;
            if (buildOptions.environment === "dev" &&
                buildOptions.devBuildType === "module ts") {
                lintDirectory += `pages/${buildOptions.devBuildModule}/`;
            }

            const {ESLint} = require("eslint");
            const eslint = new ESLint({
                useEslintrc: true
            });
            let eslintResult;
            try {
                eslintResult = await eslint.lintFiles([lintDirectory + "**/*.ts"]);
            } catch (exception) {
                myFunctions.log(" ERROR", colors.red);
                myFunctions.log(exception.toString(), colors.red);
                return exception.toString();
            }
            const formatter = await eslint.loadFormatter("stylish");
            const resultText = formatter.format(eslintResult);
            if (resultText.length > 0) {
                myFunctions.log(" PROBLEM", colors.red);
                myFunctions.log(resultText);
                return resultText;
            }
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning prod directory",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod";
        },
        fn: async function (buildOptions) {
            fs.rmSync(bengularJson.prodDirectory, {recursive: true, force: true});
            fs.mkdirSync(bengularJson.prodDirectory);
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning generated ts",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                (buildOptions.environment === "dev" &&
                    (buildOptions.devBuildType === "all" ||
                        buildOptions.devBuildType === "all ts"));
        },
        fn: async function (buildOptions) {
            if (!fs.existsSync(bengularJson.generatedDirectory)) {
                fs.mkdirSync(bengularJson.generatedDirectory);
            }
            const tsFiles = myFunctions.getFiles(bengularJson.generatedDirectory, "ts");
            for (let i = 0; i < tsFiles.length; i++) {
                fs.rmSync(tsFiles[i].path);
            }
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning generated html",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                (buildOptions.environment === "dev" &&
                    (buildOptions.devBuildType === "all" ||
                        buildOptions.devBuildType === "all html"));
        },
        fn: async function (buildOptions) {
            const htmlFiles = myFunctions.getFiles(bengularJson.generatedDirectory, "html");
            for (let i = 0; i < htmlFiles.length; i++) {
                fs.rmSync(htmlFiles[i].path);
            }
            return 0;
        }
    });

    allTasks.push({
        name: "cleaning generated scss",
        willRun: function (buildOptions) {
            return buildOptions.environment === "prod" ||
                (buildOptions.environment === "dev" &&
                    (buildOptions.devBuildType === "all" ||
                        buildOptions.devBuildType === "all scss"));
        },
        fn: async function (buildOptions) {
            const scssFiles = myFunctions.getFiles(bengularJson.generatedDirectory, "css");
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
            const pageLoadsDirectory = bengularJson.generatedDirectory + "page-loads/";

            if (!fs.existsSync(pageLoadsDirectory)) {
                fs.mkdirSync(pageLoadsDirectory);
            }

            // Nothing needed in the prod on page load
            fs.writeFileSync(pageLoadsDirectory + "on-page-load-prod.js", "");

            const onPageLoadDev = myFunctions.getAutoRefreshScript();
            fs.writeFileSync(pageLoadsDirectory + "on-page-load-dev.js", onPageLoadDev);

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
                return tscResult.stdout;
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
            const outDir = bengularJson.generatedDirectory + "build/";
            const shared = myFunctions.getShared(bengularJson);
            await myFunctions.bundle(module.name, module.entryDir, outDir, shared, bengularJson);
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

            if (!fs.existsSync(bengularJson.generatedDirectory + "build/")) {
                fs.mkdirSync(bengularJson.generatedDirectory + "build/");
            }
            const htmlFiles = myFunctions.getFiles(bengularJson.pagesDirectory, "html");
            const bundles = [];
            for (let i = 0; i < htmlFiles.length; i++) {
                const moduleName = htmlFiles[i].name.replace(".html", "");
                bundles.push({
                    name: moduleName,
                    entryDir: moduleName + "/"
                });
            }

            let outDir = "";
            if (buildOptions.environment === "prod") {
                outDir = bengularJson.prodDirectory;
            } else {
                outDir = bengularJson.generatedDirectory + "build/";
            }

            const browserify = require("browserify");
            const shared = myFunctions.getShared(bengularJson);
            for (const bundle of bundles) {
                await myFunctions.bundle(bundle.name, bundle.entryDir, outDir, shared, bengularJson);
            }

            //Doing the shared bundle now
            const isDev = bengularJson.buildOptions.environment === "dev";
            let b = browserify([], {
                debug: isDev
            });
            for (const sharedJs of shared) {
                b.require(bengularJson.generatedDirectory + "tsc-dist/shared/" + sharedJs.entryDir + sharedJs.name + ".js", {
                    expose: "./shared/" + sharedJs.entryDir + sharedJs.name
                });
            }

            const buffer = await promisify(b.bundle.bind(b))();
            let bundleAsString = buffer.toString();
            bundleAsString += fs.readFileSync(bengularJson.generatedDirectory + "page-loads/on-page-load-" + buildOptions.environment + ".js", "utf8");
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
            if (!fs.existsSync(bengularJson.generatedDirectory + "scss/")) {
                fs.mkdirSync(bengularJson.generatedDirectory + "scss/");
            }
            const sass = require("sass");

            const scssFiles = myFunctions.getFiles(bengularJson.srcDirectory, "scss");
            for (let i = 0; i < scssFiles.length; i++) {
                const scssFile = scssFiles[i];
                if (scssFile.name[0] !== "_") {
                    try {
                        const cssResult = sass.renderSync({
                            file: scssFile.path,
                            outputStyle: "compressed",
                            sourceMap: false
                        });
                        let newFilePath = scssFile.path.replace(bengularJson.srcDirectory, bengularJson.generatedDirectory + "scss/");
                        fs.mkdirSync(newFilePath.replace(scssFile.name, ""),
                            {recursive: true});
                        newFilePath = newFilePath.replace(".scss", ".css");
                        fs.writeFileSync(newFilePath, cssResult.css.toString());
                    } catch (exception) {
                        myFunctions.log(exception.toString(), colors.red);
                        return exception.toString();
                    }
                }
            }

            const cssFiles = myFunctions.getFiles(bengularJson.generatedDirectory + "scss/", "css");
            myFunctions.copyButFlatten(cssFiles, bengularJson.generatedDirectory + "build/");

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
            let cssFiles = myFunctions.getFiles(bengularJson.generatedDirectory + "scss/", "css");
            const dest = buildOptions.environment === "prod" ? bengularJson.prodDirectory : bengularJson.generatedDirectory + "build/";
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
            let htmlFiles = myFunctions.getFiles(bengularJson.srcDirectory, "html", [bengularJson.componentsDirectory]);
            const dest = buildOptions.environment === "prod" ? bengularJson.prodDirectory : bengularJson.generatedDirectory + "build/";
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
            if (!fs.existsSync(bengularJson.assetsDirectory)) {
                fs.mkdirSync(bengularJson.assetsDirectory);
            }
            let assetsFiles = myFunctions.getFiles(bengularJson.assetsDirectory, "*");
            for (let i = 0; i < assetsFiles.length; i++) {
                const assetFile = assetsFiles[i];
                const prodFilePath = assetFile.path.replace(assetFile.name, "").replace(bengularJson.srcDirectory, bengularJson.prodDirectory);
                if (!fs.existsSync(prodFilePath)) {
                    fs.mkdirSync(prodFilePath, {recursive: true});
                }
                fs.copyFileSync(assetFile.path, prodFilePath + assetFile.name);
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
            //Just in case the directory is missing
            if (!fs.existsSync(bengularJson.componentsDirectory)) {
                fs.mkdirSync(bengularJson.componentsDirectory);
            }

            let toReplace = [];

            const componentFileNames = fs.readdirSync(bengularJson.componentsDirectory);
            for (let i = 0; i < componentFileNames.length; i++) {
                let componentName = componentFileNames[i].replace(".html", "");
                let component = fs.readFileSync(bengularJson.componentsDirectory + componentFileNames[i], "utf8");
                toReplace.push({
                    search: "<component data-name=\"" + componentName + "\"></component>",
                    replace: component
                });
            }

            const docsFileNames = fs.readdirSync(bengularJson.prodDirectory);
            for (let i = 0; i < docsFileNames.length; i++) {
                let docFilePath = bengularJson.prodDirectory + docsFileNames[i];
                if (!docFilePath.includes(".html")) {
                    continue;
                }
                let html = fs.readFileSync(docFilePath, "utf8");
                for (let j = 0; j < toReplace.length; j++) {
                    html = html.replaceAll(toReplace[j].search, toReplace[j].replace);
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

            const htmlFiles = myFunctions.getFiles(bengularJson.prodDirectory, "html")
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
            const uglifyJs = require("uglify-js");
            const jsFiles = myFunctions.getFiles(bengularJson.prodDirectory, "js")
            for (let i = 0; i < jsFiles.length; i++) {
                const docFilePath = jsFiles[i].path;
                const js = fs.readFileSync(docFilePath, "utf8");
                const result = uglifyJs.minify(js);
                if (result.error != null) {
                    myFunctions.log(` ERROR\nMinifying bundle ${docFilePath}`, colors.red);
                    myFunctions.log(result.error, colors.red);
                    return result.error;
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

            http.get(`http://localhost:${bengularJson.port}/refresh/${buildId}`, (resp) => {
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
        if (bengularJson.buildOptions.environment === "prod") {
            result.buildOptions.environment = "prod";
            myFunctions.log(`Build type: prod`);
        } else if (bengularJson.buildOptions.environment === "dev") {
            result.buildOptions.environment = "dev";
            if (bengularJson.buildOptions.changedFile != null) {
                const pageDirectoryNoDotSlash = bengularJson.pagesDirectory.replace("./", "");
                //It's a grunt watch reload, so choose the correct file type
                const filepath = bengularJson.buildOptions.changedFile;
                const extension = filepath.split(".").pop().toLowerCase();
                if (filepath.includes(pageDirectoryNoDotSlash)) {
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

        result.verbose = bengularJson.verbose;

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
                myFunctions.log(taskResult, colors.red);
            }
            if (options.verbose) {
                const seconds = myFunctions.secondsSince(taskStartTime);
                myFunctions.log(`duration: ${seconds}s`);
                if (taskResult === 0) {
                    myFunctions.log(`result: success`);
                }
            }
            if (taskResult !== 0) {
                if (taskResult === 1) {
                    taskResult = "Unspecified error.\nPlease pray for more information, and check the console.\nIf it's reproducible, let me know!";
                }
                if (bengularJson.buildOptions.environment === "dev") {
                    showErrorPage(task.name, taskResult);
                }
                return 1;
            }
            tasksDone = myFunctions.endTask(tasksDone);
        }

        const seconds = myFunctions.secondsSince(buildStartTime);
        myFunctions.clearLine();
        myFunctions.log(`${myFunctions.getBar(tasksDone, amountOfTasks)} Built in ${seconds}s`);
        return 0;
    }

    function showErrorPage(taskName, error) {
        if (options.buildOptions.environment === "dev" &&
            bengularJson.buildOptions.changedFile == null) {
            //Initial build, don't show it
            return;
        }

        const http = require("http");

        const data = JSON.stringify({
            taskName: taskName,
            error: error,
            buildId: buildId
        });

        // TODO: Work out why it's dropping the 2 last characters regardless of length
        // myFunctions.log(data, colors.grey);
        // myFunctions.log(`Length: ${data.length}`, colors.grey);

        const requestOptions = {
            hostname: "localhost",
            port: bengularJson.port,
            path: "/bengular-build-error",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": data.length
            }
        }

        const req = http.request(requestOptions, res => {
            //Should have worked
            if (res.statusCode !== 200) {
                myFunctions.log(`Failed to show error page (1)\nStatus: ${res.statusCode}`, colors.red);
            }
        });

        req.on("error", error => {
            myFunctions.log(`Failed to show error page (2)\n${error.toString()}`, colors.red);
        })

        req.write(data);
        req.end();
    }

    return await runTasks();
}

function getBuildId(date) {
    const seconds = pad(date.getSeconds());
    const minutes = pad(date.getMinutes());
    return Buffer.from(`${minutes}${seconds}`)
        .toString("base64")
        .replaceAll("=", "");
}

function pad(n) {
    return ("0" + n).slice(-2);
}

module.exports = {
    build
};