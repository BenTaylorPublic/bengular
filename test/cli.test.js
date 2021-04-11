const chai = require("chai");
const expect = chai.expect;

function removeArgs(args) {
    for (let i = args.length; i >= 0; i--) {
        if (["help", "version", "init", "dev", "build"].includes(args[i])) {
            args.splice(i, 1);
        }
    }
}

describe("cli", function () {
    let cli;
    before(function () {
        cli = require("../lib/cli");
    });
    describe("help", function () {
        beforeEach(function () {
            removeArgs(process.argv);
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
            removeArgs(process.argv);
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
});