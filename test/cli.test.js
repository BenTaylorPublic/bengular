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
            console.log = function (versionMessage) {
                expect(versionMessage).to.be.a("string");
                expect(versionMessage).to.include("Bengular v");
            };
            cli();
        })
        it("Should match package json", function () {
            const bengularPackageJson = require("../package.json");
            console.log = function (versionMessage) {
                expect(versionMessage).to.include(bengularPackageJson.version);
            };
            cli();
        })
    });
});