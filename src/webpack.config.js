module.exports = {
    entry: {
        main: "./src/js/index.js",
        ww: "./src/js/ww.js"
    },
    output: {
        path: "./dist/js",
        filename: "[name].js"
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
                            browsers: ["last 2 versions", "> 2%"]
                        }
                    }]]
                }
            }
        ]
    }
};
