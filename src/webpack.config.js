module.exports = {
    entry: ["./src/js/index.js"],
    output: {
        path: "./src/js",
        filename: "main.js"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: [["env", {
                        useBuiltIns: true,
                        targets: {
                            browsers: ["last 2 versions", "ie 11"]
                        }
                    }]]
                }
            }
        ]
    }
};
