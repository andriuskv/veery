const webpack = require("webpack");

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
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                YOUTUBE_API_KEY: JSON.stringify(process.env.YOUTUBE_API_KEY),
                SOUNDCLOUD_API_KEY: JSON.stringify(process.env.SOUNDCLOUD_API_KEY),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY)
            }
        })
    ]
};
