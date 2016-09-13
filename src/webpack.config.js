const path = require("path");

module.exports = {
    entry: "./src/js/index.js",
    output: {
        path: __dirname + "/js",
        filename: "main.js"
    },
    resolve: {
        extensions: ["", ".js"],
        modules: [path.resolve(__dirname, "js/dev"), "node_modules"]
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ["latest"]
                }
            }
        ]
    }
};
