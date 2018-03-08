const path = require("path");
const { DefinePlugin } = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function(env = {}) {
    const mode = env.prod ? "production" : "development";
    const plugins = [
        new ExtractTextPlugin("main.css"),
        new HtmlWebpackPlugin({
            template: "./src/index.html"
        }),
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(mode),
                YOUTUBE_API_KEY: JSON.stringify(process.env.YOUTUBE_API_KEY),
                SOUNDCLOUD_API_KEY: JSON.stringify(process.env.SOUNDCLOUD_API_KEY),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY)
            }
        })
    ];

    if (env.prod) {
        plugins.push(
            new UglifyJsPlugin({
                uglifyOptions: {
                    ecma: 8
                }
            })
        );
    }

    return {
        mode,
        entry: {
            main: "./src/js/index.js"
        },
        output: {
            path: path.resolve(__dirname, "./dist"),
            filename: "[name].js"
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: [{
                            loader: "css-loader",
                            options: {
                                sourceMap: !env.prod,
                                url: false,
                                minimize: env.prod
                            }
                        }, {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !env.prod,
                                plugins: () => [
                                    require("autoprefixer")(),
                                    require("css-mqpacker")()
                                ]
                            }
                        }, {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !env.prod
                            }
                        }]
                    })
                },
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    exclude: /node_modules/,
                    options: {
                        presets: [["@babel/preset-env", {
                            modules: false,
                            shippedProposals: true,
                            loose: true,
                            useBuiltIns: "usage"
                        }]],
                        plugins: ["@babel/plugin-syntax-dynamic-import"]
                    }
                }
            ]
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
            ignored: /node_modules/
        },
        devtool: env.prod ? false : "inline-source-map",
        plugins
    };
};
