<template>
	<div class="pdf-thumbnail" :class="{ loading, errored }">
		<!-- Loading state -->
		<div v-if="loading" class="pdf-loading">
			<div class="spinner"></div>
		</div>

		<!-- Error fallback -->
		<div v-else-if="errored" class="pdf-fallback">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<polyline points="14 2 14 8 20 8" />
			</svg>
			<span class="fallback-label">PDF</span>
		</div>

		<!-- Rendered thumbnail -->
		<template v-else>
			<canvas ref="canvas" class="pdf-canvas"></canvas>
			<div class="pdf-badge">PDF</div>
			<div v-if="pageCount" class="pdf-pages">{{ pageCount }} {{ pageCount === 1 ? 'page' : 'pages' }}</div>
		</template>
	</div>
</template>

<script>
let pdfjsLib = null;

async function loadPdfJs() {
	if (pdfjsLib) return pdfjsLib;
	pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
	pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
	return pdfjsLib;
}

export default {
	props: {
		url: { type: String, required: true },
		maxWidth: { type: Number, default: 280 },
	},

	data() {
		return {
			loading: true,
			errored: false,
			pageCount: 0,
		};
	},

	watch: {
		url: {
			immediate: true,
			handler() {
				this.renderPdf();
			},
		},
	},

	methods: {
		async renderPdf() {
			this.loading = true;
			this.errored = false;
			this.pageCount = 0;

			try {
				const pdfjs = await loadPdfJs();
				const loadingTask = pdfjs.getDocument({ url: this.url, disableAutoFetch: true, disableStream: true });
				const pdf = await loadingTask.promise;

				this.pageCount = pdf.numPages;

				const page = await pdf.getPage(1);
				const viewport = page.getViewport({ scale: 1 });

				// Scale to fit within maxWidth
				const scale = this.maxWidth / viewport.width;
				const scaledViewport = page.getViewport({ scale });

				await this.$nextTick();
				const canvas = this.$refs.canvas;
				if (!canvas) return;

				canvas.width = scaledViewport.width;
				canvas.height = scaledViewport.height;

				const ctx = canvas.getContext("2d");
				await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

				pdf.destroy();
			} catch (err) {
				console.error("PDF thumbnail error:", err);
				this.errored = true;
			} finally {
				this.loading = false;
			}
		},
	},
};
</script>

<style scoped lang="scss">
.pdf-thumbnail {
	position: relative;
	display: inline-block;
	border-radius: 8px;
	overflow: hidden;
	background: #f8fafc;
	min-height: 80px;
	min-width: 160px;

	&.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 200px;
		height: 120px;
	}

	&.errored {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 6px;
		width: 200px;
		height: 120px;
		background: #fef2f2;
	}
}

.pdf-canvas {
	display: block;
	width: 100%;
	height: auto;
	border-radius: 8px;
}

.pdf-badge {
	position: absolute;
	top: 8px;
	left: 8px;
	background: #ef4444;
	color: white;
	font-size: 10px;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: 4px;
	letter-spacing: 0.5px;
}

.pdf-pages {
	position: absolute;
	bottom: 8px;
	right: 8px;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	font-size: 10px;
	font-weight: 500;
	padding: 2px 8px;
	border-radius: 4px;
}

.pdf-loading {
	display: flex;
	align-items: center;
	justify-content: center;
}

.spinner {
	width: 24px;
	height: 24px;
	border: 3px solid #e2e8f0;
	border-top-color: #ef4444;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.pdf-fallback {
	text-align: center;
}

.fallback-label {
	font-size: 11px;
	font-weight: 600;
	color: #ef4444;
}
</style>
