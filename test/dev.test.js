const chai = require("chai");
const expect = chai.expect;
const {spawn} = require("child_process");
const http = require("http");
const fs = require("fs");

function startBengularAsync(options) {
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

describe("📡 dev", function () {
    before(function () {
        if (global.skipConnectionRequiredTests) {
            this.skip();
            return;
        }
        process.chdir("temp/");
    });

    it("📡 Should start dev server", function (done) {
        this.timeout(10_000);
        let bengularDevResult = startBengularAsync(["dev"]);

        bengularDevResult.stdout.on('data', function (data) {
            const dataString = data.toString();

            //Check the stdout to see if it built
            if (dataString.includes("Now serving at http://localhost:8080")) {

                //Check if root is a redirect
                http.get("http://localhost:8080/", (resp) => {
                    expect(resp.statusCode).to.be.a("number");
                    expect(resp.statusCode).to.equal(302);

                    //Checking if it can get index.html
                    http.get("http://localhost:8080/index.html", (resp) => {
                        expect(resp.statusCode).to.be.a("number");
                        expect(resp.statusCode).to.equal(200);

                        //All done testing
                        //Time to kill it
                        expect(bengularDevResult.kill("SIGINT")).to.be.true;
                        done();
                    }).on("error", (err) => {
                        bengularDevResult.kill("SIGINT");
                        expect.fail("Bad response for get index: " + err);
                        done();
                    });
                }).on("error", (err) => {
                    bengularDevResult.kill("SIGINT");
                    expect.fail("Bad response for get redirect: " + err);
                    done();
                });

            }
        });
    });


    describe("📡 rebuilds", function () {

        let bengularProcess;

        beforeEach(function (done) {
            this.timeout(10_000);
            bengularProcess = startBengularAsync(["dev"]);

            bengularProcess.stdout.on('data', function (data) {
                if (data.toString().includes("Now serving at http://localhost:8080")) {
                    done();
                }
            });
        });

        it("📡 Page html change", function () {
            this.timeout(10_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the module html build type
            //Check that it includes a flag (<div>marker1</div>)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Page ts change", function () {
            this.timeout(10_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the module ts build type
            //Check that it includes a flag (console.log("marker2");)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Page scss change", function () {
            this.timeout(10_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the module scss build type
            //Check that it includes a flag (.marker3{})
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Component change", function () {
            this.timeout(10_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the all html build type
            //GET request the index.html and ensure it has the marker in it (<div>marker4</div>)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Shared ts change", function () {
            this.timeout(10_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the all ts build type
            //Check that the shared bundle includes a flag (console.log("marker4");)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Global styles change", function () {
            this.timeout(10_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the all scss build type
            //Check that it includes a flag (.marker3{})
            //Remove the skip once it's all working
            this.skip();
        });

        afterEach(function () {
            bengularProcess.kill("SIGINT");
        });
    });

    after(function () {
        if (global.skipConnectionRequiredTests) {
            return;
        }
        process.chdir("..");
    });
});