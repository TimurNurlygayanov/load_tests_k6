const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        // Load tests
        'user-creation': './tests/user-creation.test.ts',
        'market-data': './tests/market-data.test.ts',
        'order-placement': './tests/order-placement.test.ts',
        'trading-scenario': './tests/trading-scenario.test.ts',
        // Stress tests
        'user-profiles': './tests/user-profiles.test.ts',
        'price-spike-stress': './tests/price-spike-stress.test.ts',
        // Extreme stress tests (1M RPS)
        'extreme-market-latest': './tests/extreme-market-latest.test.ts',
        'extreme-order-market': './tests/extreme-order-market.test.ts',
        'extreme-user-positions': './tests/extreme-user-positions.test.ts',
        // Performance tests
        'perf-market-latest': './tests/perf-market-latest.test.ts',
        'perf-order-market': './tests/perf-order-market.test.ts',
        'perf-user-positions': './tests/perf-user-positions.test.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs',
        filename: '[name].test.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    target: 'web',
    externals: /^(k6|https?\:\/\/)(\/.*)?/,
    stats: {
        colors: true,
    },
    optimization: {
        minimize: false,
    },
};
