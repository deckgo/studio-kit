const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const {GenerateSW} = require('workbox-webpack-plugin');

const webpack = require('webpack');

const path = require('path');

const config = {
    entry: path.resolve(__dirname, 'src', 'index.js'),
    output: {
        filename: '[name].[chunkhash].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },
    devServer: {
        open: true,
        port: 3000,
        publicPath: '{{DECKDECKGO_BASE_HREF}}',
        openPage: 'http://localhost:3000{{DECKDECKGO_BASE_HREF}}'
    }
};

const plugins = [
    new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false
    }),
    new HtmlWebpackPlugin({
        hash: true,
        inject: true,
        template: path.resolve(__dirname, 'src', 'index.html'),
        path: path.join(__dirname, '../dist/'),
        filename: 'index.html'
    }),
    new CopyWebpackPlugin({
        patterns: [
            {from: 'src/assets/', to: 'assets'},
            {from: 'src/manifest.json', to: ''},
            {from: 'src/robots.txt', to: ''}
        ]
    })
];

module.exports = (env, argv) => {

    if (argv.mode === 'development' || argv.mode === 'local') {
        config.devtool = 'source-map';
    }

    if (argv.mode === 'production') {
        plugins.push(new GenerateSW({
            ignoreURLParametersMatching: [/./],

            runtimeCaching: [{
                urlPattern: new RegExp(/^(?!.*(?:unsplash|giphy|tenor|firebasestorage))(?=.*(?:png|jpg|jpeg|svg|webp|gif)).*/),
                handler: 'CacheFirst',
                options: {
                    cacheName: 'images',
                    expiration: {
                        maxEntries: 60,
                        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                    },
                }
            },{
                urlPattern: new RegExp(/^(?=.*(?:unsplash|giphy|tenor|firebasestorage))(?=.*(?:png|jpg|jpeg|svg|webp|gif)).*/),
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'cors-images',
                    expiration: {
                        maxEntries: 60,
                        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                    },
                    cacheableResponse: {
                        statuses: [0, 200]
                    }
                }
            },{
                urlPattern: new RegExp(/^https:\/\/fonts\.googleapis\.com/),
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'google-fonts-stylesheets'
                }
            },{
                urlPattern: new RegExp(/^https:\/\/fonts\.gstatic\.com/),
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-stylesheets',
                    expiration: {
                        maxEntries: 310,
                        maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
                    },
                }
            }]
        }));
    }

    config.plugins = plugins;

    let processEnv;

    if (env && env.local) {
        processEnv = {
            'process.env': {
                SIGNALING_SERVER: JSON.stringify('http://localhost:3002')
            }
        };
    } else {
        processEnv = {
            'process.env': {
                SIGNALING_SERVER: JSON.stringify('https://api.deckdeckgo.com')
            }
        };
    }

    if (env && env.noRemote) {
        processEnv['process.env']['NO_REMOTE'] = true;
    }

    plugins.push(
        new webpack.DefinePlugin(processEnv)
    );

    return config;
};
