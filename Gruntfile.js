let osIsWindows = process.platform === "win32";
let nodeCommand = osIsWindows ? "node" : "node";
module.exports = function (grunt) {

    grunt.loadNpmTasks("grunt-run");
    grunt.loadNpmTasks("grunt-contrib-watch");


    grunt.initConfig({
        filepath: "",
        run: {
            options: {},
            build: {
                cmd: nodeCommand,
                args: [
                    "./bengular/build.js",
                    "--dev",
                    "--filepath=<%= filepath %>"
                ]
            }
        },
        watch: {
            watchAllExtensions: {
                files: ["src/**"],
                tasks: ["run:build"],
                options: {
                    spawn: false
                }
            }
        }
    });


    grunt.event.on("watch", function (action, filepath) {
        grunt.config.set("filepath", `./${filepath}`);
    });

    grunt.registerTask("default", ["watch"]);

};