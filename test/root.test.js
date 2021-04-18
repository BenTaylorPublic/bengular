const chai = require("chai");
const expect = chai.expect;
const fs = require("fs");

function removeArgs(args) {
    for (let i = args.length; i >= 0; i--) {
        if (["help", "version", "init", "dev", "build"].includes(args[i])) {
            args.splice(i, 1);
        }
    }
}

before(function () {
    //Set to false to test flows that run using `npm install`
    //Slows down the tests a bit, but it's the only way to know if it'll fully work
    global.skipConnectionRequiredTests = false;
    if (global.skipConnectionRequiredTests) {
        console.info("📡 Tests disabled. They will be skipped and marked as pending");
        return;
    }

    console.info("📡 Tests enabled\nCreating a test project for the tests to run on. Please wait...");

    this.timeout(60_000);
    process.chdir("./test/generated/");

    //Setting up the temp project
    if (!fs.existsSync("./temp/")) {
        fs.mkdirSync("temp");
    } else {
        fs.rmdirSync("./temp/", {recursive: true});
        fs.mkdirSync("temp");
    }
    process.chdir("./temp/");
    const cli = require("../lib/cli");
    console.log = function (message) {
    };
    process.argv.push("init");
    cli.cli();
    process.chdir("..");
});

beforeEach(function () {
    removeArgs(process.argv);
});

after(function () {
    if (global.skipConnectionRequiredTests) {
        return;
    }
    if (fs.existsSync("./temp/")) {
        fs.rmdirSync("temp", {recursive: true});
        process.chdir("../../");
    } else {
        console.error("Failed to remove './test/generated/temp/', current directory: " + process.cwd());
    }
});

it("📡 Test project generated properly", function () {
    if (global.skipConnectionRequiredTests) {
        this.skip();
        return;
    }

    expect(fs.existsSync("./temp/")).to.be.true;

    process.chdir("./temp/");

    expect(fs.existsSync("./docs/")).to.be.true;
    expect(fs.existsSync("./generated/")).to.be.true;
    expect(fs.existsSync("./node_modules/")).to.be.true;
    expect(fs.existsSync("./.eslintrc")).to.be.true;
    expect(fs.existsSync("./bengular.json")).to.be.true;
    expect(fs.existsSync("./package.json")).to.be.true;
    expect(fs.existsSync("./package-lock.json")).to.be.true;
    expect(fs.existsSync("./tsconfig.json")).to.be.true;

    expect(fs.existsSync("./src/")).to.be.true;
    expect(fs.existsSync("./src/components/")).to.be.true;
    expect(fs.existsSync("./src/components/example-component.html")).to.be.true;
    expect(fs.existsSync("./src/pages/")).to.be.true;
    expect(fs.existsSync("./src/pages/index/")).to.be.true;
    expect(fs.existsSync("./src/pages/index/index.html")).to.be.true;
    expect(fs.existsSync("./src/pages/index/index.scss")).to.be.true;
    expect(fs.existsSync("./src/pages/index/index.ts")).to.be.true;

    expect(fs.existsSync("./src/shared/example-service.ts")).to.be.true;

    expect(fs.existsSync("./src/styles/global-styles.scss")).to.be.true;

    process.chdir("..");
});