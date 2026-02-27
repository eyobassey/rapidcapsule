const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
	transpileDependencies: true,
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
});
