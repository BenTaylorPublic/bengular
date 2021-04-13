const chai = require("chai");
const expect = chai.expect;
const {spawnSync} = require("child_process");
const fs = require("fs");

function startBengularSync(options) {
    return spawnSync(
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
        this.timeout(10_000);
        let bengularBuildResult = startBengularSync(["build", "--dev"]);

        //Check the result
        expect(bengularBuildResult.stdout).to.contain("Build type: dev");
        expect(bengularBuildResult.stdout).to.contain("Built in ");

        //Ensure the generated/build/ directory in temp contains:
        expect(fs.existsSync("./generated/build/index.html")).to.be.true;
        expect(fs.existsSync("./generated/build/index.css")).to.be.true;
        expect(fs.existsSync("./generated/build/index.bundle.js")).to.be.true;
        expect(fs.existsSync("./generated/build/shared.bundle.js")).to.be.true;
        expect(fs.existsSync("./generated/build/global-styles.css")).to.be.true;

        //Ensure that the index.html in generated/build/ still has a component reference in it
        const indexHtmlInDocs = fs.readFileSync("./generated/build/index.html", "utf8");
        expect(indexHtmlInDocs).to.contain("<component data-name=\"example-component\"></component>");
        expect(indexHtmlInDocs).to.not.contain("This is an example component");
    });

    it("📡 Should prod build test project", function () {
        this.timeout(10_000);
        let bengularBuildResult = startBengularSync(["build", "--prod"]);

        //Check the result
        expect(bengularBuildResult.stdout).to.contain("Build type: prod");
        expect(bengularBuildResult.stdout).to.contain("Built in ");

        //Ensure the docs directory in temp contains:
        expect(fs.existsSync("./docs/index.html")).to.be.true;
        expect(fs.existsSync("./docs/index.css")).to.be.true;
        expect(fs.existsSync("./docs/index.bundle.js")).to.be.true;
        expect(fs.existsSync("./docs/shared.bundle.js")).to.be.true;
        expect(fs.existsSync("./docs/global-styles.css")).to.be.true;

        //Ensure that the index.html in docs doesn't still have a component reference in it
        const indexHtmlInDocs = fs.readFileSync("./docs/index.html", "utf8");
        expect(indexHtmlInDocs).to.contain("This is an example component");
        expect(indexHtmlInDocs).to.not.contain("<component data-name=\"example-component\"></component>");
    });

    after(function () {
        if (global.skipConnectionRequiredTests) {
            return;
        }
        process.chdir("..");
    });
});