<template>
	<div class="media-viewer" @click.self="$emit('close')">
		<div class="viewer-header">
			<span class="file-name">{{ attachment.original_name }}</span>
			<div class="viewer-actions">
				<button @click="$emit('download', attachment)" title="Download">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
				</button>
				<button @click="$emit('close')" title="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
		</div>

		<div class="viewer-content">
			<img
				v-if="isImage"
				:src="attachment.url"
				:alt="attachment.original_name"
				@error="imgError = true"
			/>
			<div v-if="isImage && imgError" class="viewer-error">
				<p>Failed to load image</p>
				<button class="open-link" @click="openInTab">Open in new tab</button>
			</div>
			<video
				v-else-if="isVideo"
				ref="videoPlayer"
				:src="attachment.url"
				controls
				autoplay
				playsinline
			></video>
			<div v-else-if="isPdf" class="pdf-viewer-container">
				<iframe
					:src="attachment.url"
					class="pdf-iframe"
					frameborder="0"
				></iframe>
				<div class="pdf-fallback-link">
					<a :href="attachment.url" target="_blank" rel="noopener">
						Open PDF in new tab
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
						</svg>
					</a>
				</div>
			</div>
			<!-- Generic file fallback -->
			<div v-else class="generic-file-viewer">
				<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
				</svg>
				<p class="generic-file-name">{{ attachment.original_name }}</p>
				<button class="open-link" @click="$emit('download', attachment)">Download file</button>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		attachment: { type: Object, required: true },
	},
	emits: ["close", "download"],
	data() {
		return { imgError: false };
	},
	computed: {
		isImage() {
			return this.attachment.mime_type?.startsWith("image/");
		},
		isVideo() {
			return this.attachment.mime_type?.startsWith("video/");
		},
		isPdf() {
			return (
				this.attachment.mime_type === "application/pdf" ||
				this.attachment.original_name?.toLowerCase().endsWith(".pdf")
			);
		},
	},
	mounted() {
		document.addEventListener("keydown", this.handleEsc);
	},
	beforeUnmount() {
		document.removeEventListener("keydown", this.handleEsc);
		// Pause video on close
		if (this.$refs.videoPlayer) {
			this.$refs.videoPlayer.pause();
		}
	},
	methods: {
		handleEsc(e) {
			if (e.key === "Escape") this.$emit("close");
		},
		openInTab() {
			window.open(this.attachment.url, "_blank");
		},
	},
};
</script>

<style scoped lang="scss">
.media-viewer {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.9);
	z-index: 2000;
	display: flex;
	flex-direction: column;
}

.viewer-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 24px;
	color: white;
}

.file-name {
	font-size: 14px;
	opacity: 0.8;
}

.viewer-actions {
	display: flex;
	gap: 12px;
}

.viewer-actions button {
	background: rgba(255, 255, 255, 0.1);
	border: none;
	border-radius: 8px;
	padding: 8px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.15s;
}

.viewer-actions button:hover {
	background: rgba(255, 255, 255, 0.2);
}

.viewer-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	overflow: auto;
}

.viewer-content img {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
	border-radius: 4px;
}

.viewer-content video {
	max-width: 100%;
	max-height: 100%;
	border-radius: 4px;
}

.pdf-viewer-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.pdf-iframe {
	width: 100%;
	max-width: 900px;
	flex: 1;
	border-radius: 4px;
	background: white;
}

.pdf-fallback-link {
	margin-top: 12px;

	a {
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: color 0.15s;

		&:hover {
			color: white;
		}
	}
}

.viewer-error,
.generic-file-viewer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	color: rgba(255, 255, 255, 0.7);
	text-align: center;
}

.generic-file-name {
	font-size: 15px;
	color: rgba(255, 255, 255, 0.8);
	max-width: 400px;
	word-break: break-word;
}

.open-link {
	background: rgba(255, 255, 255, 0.15);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: white;
	padding: 10px 24px;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	transition: background 0.15s;

	&:hover {
		background: rgba(255, 255, 255, 0.25);
	}
}
</style>
