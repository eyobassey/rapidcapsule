export const scrollBarVizDirective = {
	mounted(el) {
		function isScrollBarViz() {
			return el.clientHeight < el.scrollHeight;
		}

		function updateScrollBarClass() {
			if (isScrollBarViz()) {
				el.classList.add("scroll-visible");
			} else {
				el.classList.remove("scroll-visible");
			}
		}

		el.addEventListener("scroll", updateScrollBarClass);
		window.addEventListener("resize", updateScrollBarClass);
		updateScrollBarClass();
	},
};
