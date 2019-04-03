const path = require("path");
const { DefinePlugin } = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const workboxPlugin = require("workbox-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = function(env = {}) {
    const mode = env.prod ? "production" : "development";
    const plugins = [
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(mode),
                YOUTUBE_API_KEY: JSON.stringify(process.env.YOUTUBE_API_KEY),
                SOUNDCLOUD_API_KEY: JSON.stringify(process.env.SOUNDCLOUD_API_KEY),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY),
                LAST_FM_API_KEY: JSON.stringify(process.env.LAST_FM_API_KEY)
            }
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        }),
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            minify: env.prod ? {
                keepClosingSlash: true,
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true
            } : undefined
        }),
        new workboxPlugin.InjectManifest({
            swSrc: "./src/sw.js",
            swDest: "./sw.js",
            globDirectory: "./dist",
            globPatterns: ["./assets/images/*", "./libs/dexie.min.js", "./ww.js", "./favicon.png"]
        }),
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ["precache*"]
        })
    ];

    return {
        mode,
        entry: {
            main: "./src/js/index.js"
        },
        output: {
            path: path.resolve(__dirname, "./dist"),
            filename: "[name].js"
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /node_modules/,
                        name: "vendor",
                        chunks: "initial"
                    }
                }
            },
            minimizer: [new TerserPlugin({
                parallel: true,
                terserOptions: {
                    ecma: 8,
                    output: {
                        comments: false
                    }
                }
            })]
        },
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    loaders: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: !env.prod,
                                url: false
                            }
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !env.prod,
                                plugins() {
                                    const plugins = [
                                        require("autoprefixer")(),
                                        require("css-mqpacker")()
                                    ];

                                    if (env.prod) {
                                        plugins.push(require("cssnano")());
                                    }
                                    return plugins;
                                }
                            }
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !env.prod
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    exclude: /node_modules/,
                    options: {
                        presets: [["@babel/preset-env", {
                            modules: false,
                            loose: true,
                            useBuiltIns: "usage",
                            corejs: 3
                        }]],
                        plugins: ["@babel/plugin-syntax-dynamic-import"]
                    }
                }
            ]
        },
        devtool: env.prod ? false : "inline-source-map",
        plugins,
        stats: {
            entrypoints: false,
            children: false
        }
    };
};
