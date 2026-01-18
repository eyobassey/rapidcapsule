const { defineConfig } = require("@vue/cli-service");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = defineConfig({
	transpileDependencies: true,
});

module.exports = {
	configureWebpack: {
		plugins: [new MiniCssExtractPlugin()],
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: [MiniCssExtractPlugin.loader, "css-loader"],
				},
			],
		},
	},
	css: {
		loaderOptions: {
			sass: {
				additionalData: `
				@import 'v-calendar/style.css';
				@import 'vue-toast-notification/dist/theme-sugar.css';
				@import 'vue-select/dist/vue-select.css';
				@import "@/Styles/variables.scss";
				@import "@/Styles/utility.scss";
				@import "@/Styles/typography.scss";
				@import "@/Styles/mixins.scss";
				@import "@/Styles/animations.scss";
				@import "@/Styles/main.scss";
				@import "@/Styles/toast.scss";
				`,
			},
		},
	},
};
