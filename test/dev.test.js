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

let filePathToReset = null;
let oldFileDataToReset = null;

function saveToFile(filePath, newFileData) {
    expect(filePathToReset).is.null;
    expect(oldFileDataToReset).is.null;

    filePathToReset = filePath;
    expect(fs.existsSync(filePath)).to.be.true;
    oldFileDataToReset = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, newFileData);
}

function resetFile() {
    expect(filePathToReset).is.not.null;
    expect(oldFileDataToReset).is.not.null;

    fs.writeFileSync(filePathToReset, oldFileDataToReset);
    filePathToReset = null;
    oldFileDataToReset = null;
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
        let finished = false;

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
                        if (finished) {
                            return;
                        }
                        expect(resp.statusCode).to.be.a("number");
                        expect(resp.statusCode).to.equal(200);

                        //All done testing
                        //Time to kill it
                        expect(bengularDevResult.kill("SIGINT")).to.be.true;
                        finished = true;
                        done();
                    }).on("error", (err) => {
                        if (finished) {
                            return;
                        }
                        bengularDevResult.kill("SIGINT");
                        expect.fail("Bad response for get index: " + err);
                        finished = true;
                        done();
                    });
                }).on("error", (err) => {
                    if (finished) {
                        return;
                    }
                    bengularDevResult.kill("SIGINT");
                    expect.fail("Bad response for get redirect: " + err);
                    finished = true;
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

        it("📡 Page html change", function (done) {
            this.timeout(10_000);
            let finished = false;
            bengularProcess.stdout.on('data', function (data) {
                if (finished) {
                    return;
                }
                if (data.toString().includes("Built in ")) {
                    http.get("http://localhost:8080/index.html", (resp) => {
                        if (finished) {
                            return;
                        }
                        finished = true;

                        expect(resp.statusCode).to.be.a("number");
                        expect(resp.statusCode).to.equal(200);

                        resp.setEncoding("utf8");
                        let data = "";
                        resp.on("data", (chunk) => {
                            data += chunk;
                        });
                        resp.on("end", () => {
                            expect(data).to.include("<div>marker1</div>");
                            resetFile();
                            done();
                        });

                    }).on("error", (err) => {
                        if (finished) {
                            return;
                        }

                        finished = true;
                        expect.fail("Bad response for get index: " + err);
                        resetFile();
                        done();
                    });
                }
            });

            //Saving to the file
            saveToFile("./src/pages/index/index.html",
                `<html lang="en">
                                <div>marker1</div>
                            </html>`);
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