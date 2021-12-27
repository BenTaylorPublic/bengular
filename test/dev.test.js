const chai = require("chai");
const expect = chai.expect;
const {spawn} = require("child_process");
const http = require("http");
const fs = require("fs");
const portToTestOn = 4200;

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

        http.get(`http://localhost:${portToTestOn}/${fileRoute}`, (resp) => {
            expect(resp.statusCode).to.be.a("number");
            expect(resp.statusCode).to.equal(200);

            resp.setEncoding("utf8");
            let data = "";
            resp.on("data", (chunk) => {
                data += chunk;
            });
            resp.on("end", () => {
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

function waitUntilServing() {
    return new Promise(resolve => {
        const bengularProcess = startBengularAsync(["dev"]);

        bengularProcess.stdout.on("data", function (data) {
            if (data.toString().includes(`Now serving at http://localhost:${portToTestOn}`)) {
                resolve(bengularProcess);
            }
        });
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
        let finished = false;

        bengularDevResult.stdout.on("data", function (data) {
            const dataString = data.toString();

            //Check the stdout to see if it built
            if (dataString.includes(`Now serving at http://localhost:${portToTestOn}`)) {

                //Check if root is a redirect
                http.get(`http://localhost:${portToTestOn}/`, (resp) => {
                    expect(resp.statusCode).to.be.a("number");
                    expect(resp.statusCode).to.equal(200);

                    //Checking if it can get index.html
                    http.get(`http://localhost:${portToTestOn}/index.html`, (resp) => {
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

        beforeEach(async function () {
            this.timeout(10_000);
            bengularProcess = await waitUntilServing();
        });

        it("📡 Component change", async function () {
            this.timeout(10_000);

            const saveFileFunction = function () {
                saveToFile("./src/components/example-component.html",
                    `<div>marker1</div>`);
            };
            await fileSaveTest(bengularProcess,
                "index.html",
                saveFileFunction,
                ["Built in ", "Build type: dev all html"],
                [`<div>marker1</div>`]);
        });

        it("📡 Page html change", async function () {
            this.timeout(10_000);

            const saveFileFunction = function () {
                saveToFile("./src/pages/index/index.html",
                    `<html lang="en">
                                <div>marker2</div>
                            </html>`);
            };
            await fileSaveTest(bengularProcess,
                "index.html",
                saveFileFunction,
                ["Built in ", "Build type: dev module html, module: index"],
                ["<div>marker2</div>"]);

        });

        it("📡 Page ts change", async function () {
            this.timeout(10_000);

            const saveFileFunction = function () {
                saveToFile("./src/pages/index/index.ts",
                    `console.log("marker3");`);
            };
            await fileSaveTest(bengularProcess,
                "index.bundle.js",
                saveFileFunction,
                ["Built in ", "Build type: dev module ts, module: index"],
                [`console.log("marker3");`]);
        });

        it("📡 Page scss change", async function () {
            this.timeout(10_000);

            const saveFileFunction = function () {
                saveToFile("./src/pages/index/index.scss",
                    `.marker4{color: red;}`);
            };
            await fileSaveTest(bengularProcess,
                "index.css",
                saveFileFunction,
                ["Built in ", "Build type: dev module scss, module: index"],
                [`.marker4`]);
        });

        it("📡 Shared ts change", async function () {
            this.timeout(10_000);

            const saveFileFunction = function () {
                saveToFile("./src/shared/example-service.ts",
                    `console.log("marker5");`);
            };
            await fileSaveTest(bengularProcess,
                "shared.bundle.js",
                saveFileFunction,
                ["Built in ", "Build type: dev all ts"],
                [`console.log("marker5");`]);
        });

        it("📡 Global styles change", async function () {
            this.timeout(10_000);

            const saveFileFunction = function () {
                saveToFile("./src/styles/global-styles.scss",
                    `.marker6{color: red;}`);
            };
            await fileSaveTest(bengularProcess,
                "global-styles.css",
                saveFileFunction,
                ["Built in ", "Build type: dev all scss"],
                [`.marker6`]);
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