const chai = require("chai");
const expect = chai.expect;

describe("cli", function () {
    let cli;
    before(function () {
        cli = require("../lib/cli");
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
        })
        it("Should match package json", function () {
            const bengularPackageJson = require("../package.json");
            let result;
            console.log = function (versionMessage) {
                result = versionMessage;
            };
            cli.cli();
            expect(result).to.include(bengularPackageJson.version);
        })
    });
});