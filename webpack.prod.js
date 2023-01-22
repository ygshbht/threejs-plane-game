const mode = "production";
const HtmlWebpackPlugin = require("html-webpack-plugin");
const express = require("express");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	// mode defaults to 'production' if not set
	mode: mode,
	entry: "./src/Game.ts",
	// entry not required if using `src/index.js` default
	// output not required if using `dist/main.js` default
	output: {
		publicPath: "/",
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},

			{
				test: /\.glsl$/i,
				loader: "html-loader",
			},
		],
	},

	devtool: "source-map",
	resolve: {
		extensions: [".ts", ".js", ".json"],
	},

	// required if using webpack-dev-server
	devServer: {
		// contentBase: "./dist",
		port: 3000,
		setupMiddlewares: (middlewares, devServer) => {
			devServer.app.use(
				"/assets/",
				express.static(path.resolve(__dirname, "./assets"))
			);
			return middlewares;
		},
	},
	plugins: [
		new HtmlWebpackPlugin({ template: "./index.htm" }),
		new CopyWebpackPlugin({
			patterns: [{ from: "assets", to: "assets" }],
		}),
	],
};
