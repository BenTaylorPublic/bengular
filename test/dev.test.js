const chai = require("chai");
const expect = chai.expect;
const {spawn} = require("child_process");

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

    it("📡 Should start dev server", function () {
        let bengularDevResult = startBengularAsync(["dev"]);

        //Check what type of object this is
        console.info(bengularDevResult);

        //Check the stdout to see if it built
        //Check that root / redirects
        //Check that it serves index.html

        //Need to somehow stop it lol

        //Remove the skip once it's all working
        this.skip();
    });


    describe("📡 rebuilds", function () {
        let spawn;
        before(function () {
            //Don't run these tests until the above one starting the dev server works
            this.skip();
            return;
            let spawn = startBengularAsync(["dev"]);
        });

        it("📡 Page html change", function () {
            this.timeout(3_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the module html build type
            //Check that it includes a flag (<div>marker1</div>)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Page ts change", function () {
            this.timeout(3_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the module ts build type
            //Check that it includes a flag (console.log("marker2");)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Page scss change", function () {
            this.timeout(3_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the module scss build type
            //Check that it includes a flag (.marker3{})
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Component change", function () {
            this.timeout(3_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the all html build type
            //GET request the index.html and ensure it has the marker in it (<div>marker4</div>)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Shared ts change", function () {
            this.timeout(3_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the all ts build type
            //Check that the shared bundle includes a flag (console.log("marker4");)
            //Remove the skip once it's all working
            this.skip();
        });

        it("📡 Global styles change", function () {
            this.timeout(3_000);
            //Check it builds again, looking at the stdout of the spawn
            //Check that it built is using the all scss build type
            //Check that it includes a flag (.marker3{})
            //Remove the skip once it's all working
            this.skip();
        });

        after(function () {
            //Kill spawn
        });
    });

    after(function () {
        if (global.skipConnectionRequiredTests) {
            return;
        }
        process.chdir("..");
    });
});