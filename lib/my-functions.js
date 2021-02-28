const colors = require("colors/safe");

module.exports = {
    getFiles: function (directory, extension, excludePaths) {
        const fs = require("fs");
        if (excludePaths != null &&
            excludePaths.includes(directory)) {
            return [];
        }
        let filesAndFolders = fs.readdirSync(directory, {withFileTypes: true});
        let result = [];
        for (let i = 0; i < filesAndFolders.length; i++) {
            const fileOrFolder = filesAndFolders[i];
            if (fileOrFolder.isDirectory()) {
                const filesFromSubdirectory = this.getFiles(directory + fileOrFolder.name + "/", extension, excludePaths);
                result = result.concat(filesFromSubdirectory);
            } else if (fileOrFolder.isFile()) {
                if (fileOrFolder.name.split(".").pop().toLowerCase() === extension) {
                    result.push({
                        path: directory + fileOrFolder.name,
                        name: fileOrFolder.name
                    });
                }
            }
        }
        return result;
    },

    copyButFlatten: function (files, dest) {
        const fs = require("fs");
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            fs.copyFileSync(file.path, dest + file.name);
        }
    },

    endTask: function (tasksDone) {
        return tasksDone + 1;
    },

    getBar: function (tasksDone, amountOfTasks) {
        let result = "[";
        for (let i = 0; i < tasksDone; i++) {
            result += "=";
        }
        for (let i = tasksDone; i < amountOfTasks; i++) {
            result += " ";
        }
        result += `] ${tasksDone}/${amountOfTasks}`;
        return result;
    },

    secondsSince: function (startDate) {
        const endTime = new Date();
        let timeDiff = endTime - startDate;
        timeDiff /= 1000;
        return timeDiff.toFixed(2);
    },

    deleteFiles: function (files) {
        const fs = require("fs");
        for (let i = 0; i < files.length; i++) {
            fs.rmSync(files[i].path);
        }
    },

    clearLine: function () {
        const readline = require("readline");
        readline.clearLine(process.stdout);
        readline.cursorTo(process.stdout, 0);
    },

    getModuleFromFilepath: function (filepath) {
        const filePathSplit = filepath.split("/");
        for (let i = 0; i < filePathSplit.length; i++) {
            if (filePathSplit[i] === "pages") {
                return filePathSplit[i + 1];
            }
        }

        throw "Module name in file path not found";
    },

    bundle: async function (name, entryDir, outDir, shared, bengularJson) {
        //Helper function
        function checkNonSharedBundle(bundleAsString) {
            const regex = new RegExp(/"\.\/shared\/[^,]*":[^u]/g)
            if (regex.test(bundleAsString)) {
                throw "Shared module bundled into regular bundle";
            }
        }

        const promisify = require("util").promisify;
        const browserify = require("browserify");
        const fs = require("fs");
        let outputFile;
        outputFile = "./" + outDir + name + ".bundle.js";

        let b = browserify();
        b.add(bengularJson.generatedDirectory + "tsc-dist/pages/" + entryDir + name + ".js");
        for (const sharedJs of shared) {
            b.exclude(bengularJson.generatedDirectory + "tsc-dist/shared/" + sharedJs.entryDir + sharedJs.name + ".js");
        }

        const buffer = await promisify(b.bundle.bind(b))();
        let bundleAsString = buffer.toString();

        /*
        Manually manipulating the javascript
        This is because in the dom it's a flat structure, but Browserify requires still have the relative layout
        The only thing it needs to "require" is shared stuff, so it should be fine to replace fix the path
        */
        bundleAsString = bundleAsString.split(`"../../../`).join(`"./`);
        bundleAsString = bundleAsString.split(`"../../`).join(`"./`);
        bundleAsString = bundleAsString.split(`"../`).join(`"./`);

        checkNonSharedBundle(bundleAsString);

        fs.writeFileSync(outputFile, bundleAsString);
    },

    getShared: function (bengularJson) {
        const sharedFiles = this.getFiles(bengularJson.srcDirectory + "shared/", "ts");
        const shared = [];
        for (let i = 0; i < sharedFiles.length; i++) {
            const file = sharedFiles[i];
            const filenameNoExtension = file.name.replace(".ts", "");
            shared.push({
                name: filenameNoExtension,
                entryDir: file.path.replace(bengularJson.srcDirectory + "shared/", "").replace(file.name, "")
            });
        }
        return shared;
    },

    log: function (message, colorFunction) {
        if (colorFunction != null) {
            console.log(colorFunction(message));
        } else {
            console.log(message);
        }
    }
}