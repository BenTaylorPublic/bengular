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

function saveToFile(filePath, newFileData) {
    expect(fs.existsSync(filePath)).to.be.true;
    fs.writeFileSync(filePath, newFileData);
}

async function waitUntilProcessStdouts(bengularProcess,
                                       stdoutStringsRequired) {
    return new Promise(resolve => {
        bengularProcess.stdout.on("data", function (data) {
            const dataString = data.toString();
            for (let i = stdoutStringsRequired.length - 1; i >= 0; i--) {
                if (dataString.includes(stdoutStringsRequired[i])) {
                    stdoutStringsRequired.splice(i, 1);
                }
            }
            if (stdoutStringsRequired.length === 0) {
                resolve(true);
            }
        });
    });
}

async function fileReturnIncludeCheck(fileRoute,
                                      getResultTextToInclude) {
    return new Promise(resolve => {

        http.get(`http://localhost:8080/${fileRoute}`, (resp) => {
            expect(resp.statusCode).to.be.a("number");
            expect(resp.statusCode).to.equal(200);

            resp.setEncoding("utf8");
            let data = "";
            resp.on("data", (chunk) => {
                data += chunk;
            });
            resp.on("end", () => {
                expect(data).to.include("<div>marker1</div>");

                for (let i = 0; i < getResultTextToInclude.length; i++) {
                    expect(data).to.include(getResultTextToInclude[i]);
                    if (!data.includes(getResultTextToInclude[i])) {
                        resolve(false);
                    }
                }

                resolve(true);
            });

        }).on("error", (err) => {
            expect.fail("Bad response for get: " + err);
            resolve(false);
        });
    });
}

async function fileSaveTest(bengularProcess,
                            fileRoute,
                            saveFileFunction,
                            stdoutStringsRequired,
                            getResultTextToInclude) {
    saveFileFunction();
    const bengularStdoutResult = await waitUntilProcessStdouts(bengularProcess, stdoutStringsRequired);
    expect(bengularStdoutResult).to.be.true;

    const getResult = await fileReturnIncludeCheck(fileRoute, getResultTextToInclude);
    expect(getResult).to.be.true;
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

        bengularDevResult.stdout.on("data", function (data) {
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

            bengularProcess.stdout.on("data", function (data) {
                if (data.toString().includes("Now serving at http://localhost:8080")) {
                    done();
                }
            });
        });

        it("📡 Page html change", async function () {
            this.timeout(10_000);

            //Saving to the file
            const saveIndexHtmlFn = function () {
                saveToFile("./src/pages/index/index.html",
                    `<html lang="en">
                                <div>marker1</div>
                            </html>`);
            };
            await fileSaveTest(bengularProcess,
                "index.html",
                saveIndexHtmlFn,
                ["Built in ", "Build type: dev module html, module: index"],
                ["<div>marker1</div>"]);

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