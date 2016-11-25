module.exports = {
    entry: "./src/js/index.js",
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
                    presets: ["latest"]
                }
            }
        ]
    }
};
