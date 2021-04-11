const chai = require("chai");
const expect = chai.expect;


describe("cli", function () {
    let cli;
    before(function () {
        cli = require("../lib/cli");
    });
    describe("help", function () {
        beforeEach(function () {
            process.argv.push("help");
        });
        it("Should output multiple help options", function () {
            let result = [];
            console.log = function (helpMessage) {
                result.push(helpMessage);
            };
            cli.cli();
            expect(result).to.be.a("array");
            expect(result).to.have.length.above(1);
            for (let i = 0; i < result.length; i++) {
                expect(result[i]).to.be.a("string");
            }
            expect(result).to.include("Usage: bengular <command>\n");
        });
    });
    describe("version", function () {
        beforeEach(function () {
            process.argv.push("version");
        });
        it("Should be a string", function () {
            let result;
            console.log = function (versionMessage) {
                result = versionMessage;
            };
            cli.cli();
            expect(result).to.be.a("string");
            expect(result).to.include("Bengular v");
        });
        it("Should match package json", function () {
            const bengularPackageJson = require("../package.json");
            let result;
            console.log = function (versionMessage) {
                result = versionMessage;
            };
            cli.cli();
            expect(result).to.include(bengularPackageJson.version);
        });
    });
    describe("init", function () {
        beforeEach(function () {
            process.argv.push("init");
        });
        it("Help menu", function () {
            process.argv.push("help");
            let result = [];
            console.log = function (helpMessage) {
                result.push(helpMessage);
            };
            cli.cli();
            expect(result).to.be.a("array");
            expect(result).to.have.length.above(1);
            for (let i = 0; i < result.length; i++) {
                expect(result[i]).to.be.a("string");
            }
            expect(result).to.include("Usage: bengular init\n");
        });
    });
    describe("build", function () {
        beforeEach(function () {
            if (global.skipConnectionRequiredTests) {
                this.skip();
                return;
            }
            process.chdir("temp/");
            process.argv.push("build");
        });
        it("📡 No environment, should error", function () {
            let result = [];
            console.log = function (buildMessages) {
                result.push(buildMessages);
            };
            cli.cli();
            expect(result).to.be.a("array");
            expect(result).to.have.length(1);
            expect(result[0]).to.be.a("string");
            expect(result[0]).to.contain("Bengular error: builds need environment");
        });
        it("📡 Help menu", function () {
            process.argv.push("help");
            let result = [];
            console.log = function (helpMessage) {
                result.push(helpMessage);
            };
            cli.cli();
            expect(result).to.be.a("array");
            expect(result).to.have.length.above(1);
            for (let i = 0; i < result.length; i++) {
                expect(result[i]).to.be.a("string");
            }
            expect(result).to.include("Usage: bengular build <options>\n");
        });
        afterEach(function () {
            if (global.skipConnectionRequiredTests) {
                this.skip();
                return;
            }
            process.chdir("..");
        });
    });
});