const webpack = require('webpack')

module.exports = function override(config, env) {
    config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
    )

    config.resolve.fallback = {
        zlib: false,
        http: false,
        https: false,
        worker_threads: false,
        path: false,
        stream: false,
        net: false,
        fs: false
    }
    return config
}
