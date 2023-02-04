const { override, addWebpackAlias, addWebpackPlugin } = require("customize-cra");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const path = require("path");
 
const addAnalyzer = () => config => {
  if (process.env.ANALYZER) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }
  return config;
};

module.exports = override(
  addAnalyzer(),
  addWebpackPlugin(
    new ProgressBarPlugin()
  ),
  addWebpackAlias({
    "@": path.resolve(__dirname, "src")
  })
);