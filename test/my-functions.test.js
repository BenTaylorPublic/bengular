const chai = require("chai");
const expect = chai.expect;

describe("myFunctions", function () {
    let myFunctions;
    before(function () {
        myFunctions = require("../lib/my-functions");
    });
    describe("myFunctions.endTask", function () {
        it("Return should be number", function () {
            expect(myFunctions.endTask(0)).to.be.a("number");
        });
        it("Should increment by 1", function () {
            const num = 0;
            expect(myFunctions.endTask(num)).to.be.equal(num + 1);
        });
    });
});