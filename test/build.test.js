const chai = require("chai");
const expect = chai.expect;
const {spawnSync} = require("child_process");

function startBengularSync(options) {
    return spawn(
        "node",
        ["../../../bin/bengular",
            ...options
        ],
        {
            encoding: "utf8",
            cwd: "./"
        });
}

describe("📡 build", function () {
    before(function () {
        if (global.skipConnectionRequiredTests) {
            this.skip();
            return;
        }
        process.chdir("temp/");
    });

    it("📡 Should dev build test project", function () {
        let bengularBuildResult = startBengularSync(["build", "--dev"]);

        //Check the result
        console.info(bengularBuildResult.stdout);
        //Ensure the generated/build/ directory in temp contains:
        //index.html
        //index.css
        //index.bundle.js
        //shared.bundle.js
        //global-styles.scss

        //Remove the skip once it's all working
        this.skip();
    });

    it("📡 Should prod build test project", function () {
        let bengularBuildResult = startBengularSync(["build", "--prod"]);

        //Check the result
        console.info(bengularBuildResult.stdout);
        //Ensure the docs directory in temp contains:
        //index.html
        //index.css
        //index.bundle.js
        //shared.bundle.js
        //global-styles.scss

        //Remove the skip once it's all working
        this.skip();
    });

    after(function () {
        if (global.skipConnectionRequiredTests) {
            return;
        }
        process.chdir("..");
    });
});