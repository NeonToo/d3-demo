const webpack = require('webpack');
const path = require('path');
const rootPath = path.resolve(__dirname, '../');

module.exports = {
    entry: {
        "main": path.resolve(rootPath, 'src/index.js'),
        "vendor": ['vue']
    },
    output: {
        path: path.resolve(rootPath, 'dist'),
        publicPath: "/dist/",
        filename: "[name].js",
        sourceMapFilename: "[name].map"
    },
    resolve: {
        extensions: ['.js', '.json', '.css', '.less', '.vue'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ["es2015", "vue-app"]
                }
            },
            {
                test: /\.(png|jpg|jpeg)$/,
                loader: "url-loader?limit=10000",
                options: {
                    publicPath: '/'
                }
            },
            {
                test: /\.vue$/,
                loader: "vue-loader"
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            axios: 'axios'
        })
    ]
};