const path = require("path");
const { DefinePlugin, optimize } = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function(env = {}) {
    const plugins = [
        new ExtractTextPlugin("main.css"),
        new HtmlWebpackPlugin({
            template: "./src/index.html"
        }),
        new DefinePlugin({
            "process.env": {
                YOUTUBE_API_KEY: JSON.stringify(process.env.YOUTUBE_API_KEY),
                SOUNDCLOUD_API_KEY: JSON.stringify(process.env.SOUNDCLOUD_API_KEY),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY)
            }
        })
    ];

    if (env.prod) {
        plugins.push(
            new optimize.ModuleConcatenationPlugin(),
            new UglifyJsPlugin({
                uglifyOptions: {
                    ecma: 8
                }
            })
        );
    }

    return {
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
                                url: false
                            }
                        }, {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !env.prod,
                                plugins: () => {
                                    const plugins = [require("autoprefixer")()];

                                    if (env.prod) {
                                        plugins.push(
                                            require("css-mqpacker")(),
                                            require("cssnano")()
                                        );
                                    }
                                    return plugins;
                                }
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
        devtool: env.prod ? false : "inline-source-map",
        plugins
    };
};
