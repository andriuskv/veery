const webpack = require("webpack");
const path = require("path");

module.exports = function(env = {}) {
    const plugins = [
        new webpack.DefinePlugin({
            "process.env": {
                YOUTUBE_API_KEY: JSON.stringify(process.env.YOUTUBE_API_KEY),
                SOUNDCLOUD_API_KEY: JSON.stringify(process.env.SOUNDCLOUD_API_KEY),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY)
            }
        })
    ];

    if (env.prod) {
        plugins.push(
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                    unused: true,
                    dead_code: true,
                    screw_ie8: true,
                    unsafe: true,
                    conditionals: true,
                    comparisons: true,
                    sequences: true,
                    evaluate: true,
                    drop_console: true
                },
                output: {
                    comments: false
                }
            })
        );
    }

    return {
        entry: {
            main: "./src/js/index.js",
            ww: "./src/js/ww.js"
        },
        output: {
            path: path.resolve(__dirname, "../dist"),
            filename: "[name].js"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    exclude: /node_modules/,
                    options: {
                        presets: [["env", {
                            modules: false,
                            useBuiltIns: true,
                            targets: {
                                browsers: ["last 2 versions", "IE >= 11"]
                            }
                        }]]
                    }
                }
            ]
        },
        devtool: env.prod ? false : "inline-source-map",
        plugins
    };
};
