<template>
	<div class="chat-input-container">
		<!-- Attachment preview -->
		<div v-if="pendingFile" class="pending-attachment">
			<div class="attachment-preview-card" :class="{ 'has-thumbnail': isImageFile || isVideoFile || isPdfFile }">
				<!-- Image preview -->
				<img v-if="isImageFile" :src="previewUrl" class="image-preview" />

				<!-- Video preview -->
				<div v-else-if="isVideoFile" class="video-preview-wrapper">
					<img v-if="videoThumbnail" :src="videoThumbnail" class="video-preview" />
					<div v-else class="video-preview-placeholder">
						<div class="mini-spinner"></div>
					</div>
					<div class="video-play-badge">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
					</div>
					<video ref="hiddenVideo" :src="previewUrl" preload="metadata" style="display:none" @loadeddata="capturePreviewFrame"></video>
				</div>

				<!-- PDF preview -->
				<div v-else-if="isPdfFile" class="pdf-preview-wrapper">
					<PdfThumbnail :url="previewUrl" :maxWidth="160" />
				</div>

				<!-- Generic file preview -->
				<div v-else class="file-preview">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
					</svg>
					<div class="file-details">
						<span class="file-detail-name">{{ pendingFile.name }}</span>
						<span class="file-detail-size">{{ formatSize(pendingFile.size) }}</span>
					</div>
				</div>

				<!-- File info bar (for thumbnail types) -->
				<div v-if="isImageFile || isVideoFile || isPdfFile" class="preview-info-bar">
					<span class="preview-type-badge" :class="fileTypeBadgeClass">{{ fileTypeLabel }}</span>
					<span class="preview-file-size">{{ formatSize(pendingFile.size) }}</span>
				</div>

				<button class="remove-attachment" @click="clearAttachment">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Voice recording UI -->
		<div v-if="isRecording" class="recording-ui">
			<div class="recording-indicator">
				<span class="rec-dot"></span>
				<span>{{ recordingDuration }}</span>
			</div>
			<button class="btn-cancel-record" @click="cancelRecording">Cancel</button>
			<button class="btn-send-record" @click="stopRecording">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
					<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
				</svg>
			</button>
		</div>

		<!-- Input bar -->
		<div v-else class="input-bar">
			<button class="btn-attach" @click="$refs.fileInput.click()" title="Attach file">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
				</svg>
			</button>

			<button class="btn-voice" @click="startRecording" title="Voice note">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
					<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
					<line x1="12" y1="19" x2="12" y2="23" />
					<line x1="8" y1="23" x2="16" y2="23" />
				</svg>
			</button>

			<div class="text-input-wrapper">
				<textarea
					ref="textInput"
					v-model="text"
					placeholder="Type a message..."
					rows="1"
					@input="handleInput"
					@keydown.enter.exact.prevent="send"
				></textarea>
			</div>

			<button class="btn-send" :disabled="!canSend" @click="send" title="Send">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
				</svg>
			</button>
		</div>

		<input
			ref="fileInput"
			type="file"
			accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
			style="display: none"
			@change="onFileSelected"
		/>
	</div>
</template>

<script>
import PdfThumbnail from "./PdfThumbnail.vue";

const MIME_TYPE_MAP = {
	"image/jpeg": "image",
	"image/png": "image",
	"image/gif": "image",
	"image/webp": "image",
	"image/heic": "image",
	"video/mp4": "video",
	"video/quicktime": "video",
	"video/webm": "video",
	"audio/webm": "voice_note",
	"audio/ogg": "voice_note",
	"audio/mp4": "voice_note",
	"audio/x-m4a": "voice_note",
	"audio/mpeg": "voice_note",
};

export default {
	components: { PdfThumbnail },

	emits: ["send", "send-attachment", "typing"],

	data() {
		return {
			text: "",
			pendingFile: null,
			previewUrl: null,
			videoThumbnail: null,
			thumbnailBlob: null,
			thumbnailPromise: null,
			isSending: false,
			isRecording: false,
			mediaRecorder: null,
			audioChunks: [],
			recordingStart: null,
			recordingTimer: null,
			recordingDuration: "0:00",
		};
	},

	computed: {
		canSend() {
			return this.text.trim().length > 0 || this.pendingFile;
		},
		isImageFile() {
			return this.pendingFile?.type?.startsWith("image/");
		},
		isVideoFile() {
			return this.pendingFile?.type?.startsWith("video/");
		},
		isPdfFile() {
			return this.pendingFile?.type === "application/pdf";
		},
		fileTypeLabel() {
			if (this.isImageFile) return "Image";
			if (this.isVideoFile) return "Video";
			if (this.isPdfFile) return "PDF";
			return "File";
		},
		fileTypeBadgeClass() {
			if (this.isPdfFile) return "badge-pdf";
			if (this.isVideoFile) return "badge-video";
			return "badge-image";
		},
	},

	methods: {
		handleInput() {
			this.$emit("typing");
			this.autoResize();
		},

		autoResize() {
			const el = this.$refs.textInput;
			if (el) {
				el.style.height = "auto";
				el.style.height = Math.min(el.scrollHeight, 120) + "px";
			}
		},

		async send() {
			if (this.isSending) return;

			if (this.pendingFile) {
				this.isSending = true;
				// Wait for thumbnail generation to complete (PDF/video)
				if (this.thumbnailPromise) {
					try { await this.thumbnailPromise; } catch {}
				}

				const type = MIME_TYPE_MAP[this.pendingFile.type] || "file";
				const payload = {
					file: this.pendingFile,
					type,
					content: this.text.trim() || undefined,
				};
				// Include thumbnail blob if generated
				if (this.thumbnailBlob) {
					payload.thumbnail = new File([this.thumbnailBlob], "thumbnail.jpg", { type: "image/jpeg" });
				}
				this.$emit("send-attachment", payload);
				this.clearAttachment();
				this.text = "";
				this.isSending = false;
			} else if (this.text.trim()) {
				this.$emit("send", { content: this.text.trim() });
				this.text = "";
			}
			this.$nextTick(() => this.autoResize());
		},

		onFileSelected(event) {
			const file = event.target.files[0];
			if (!file) return;

			this.pendingFile = file;
			this.videoThumbnail = null;
			this.thumbnailBlob = null;
			this.thumbnailPromise = null;

			if (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf") {
				this.previewUrl = URL.createObjectURL(file);
			}

			// Generate thumbnails for video and PDF
			if (file.type.startsWith("video/")) {
				this.thumbnailPromise = this.generateVideoThumbnail(file);
			} else if (file.type === "application/pdf") {
				this.thumbnailPromise = this.generatePdfThumbnail(file);
			}

			event.target.value = "";
		},

		clearAttachment() {
			if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
			this.pendingFile = null;
			this.previewUrl = null;
			this.videoThumbnail = null;
			this.thumbnailBlob = null;
			this.thumbnailPromise = null;
		},

		generateVideoThumbnail(file) {
			return new Promise((resolve) => {
				const url = URL.createObjectURL(file);
				const video = document.createElement("video");
				video.preload = "auto";
				video.muted = true;
				video.playsInline = true;
				video.src = url;

				video.addEventListener("loadeddata", () => {
					video.currentTime = 0.5;
				});

				video.addEventListener("seeked", () => {
					try {
						const canvas = document.createElement("canvas");
						const maxW = 400;
						const scale = Math.min(maxW / video.videoWidth, 1);
						canvas.width = video.videoWidth * scale;
						canvas.height = video.videoHeight * scale;
						canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
						this.videoThumbnail = canvas.toDataURL("image/jpeg", 0.7);
						canvas.toBlob((blob) => {
							this.thumbnailBlob = blob;
							resolve();
						}, "image/jpeg", 0.7);
					} catch (e) {
						console.warn("Video thumbnail capture failed:", e);
						resolve();
					}
					URL.revokeObjectURL(url);
				});

				video.addEventListener("error", () => {
					URL.revokeObjectURL(url);
					resolve();
				});
			});
		},

		async generatePdfThumbnail(file) {
			try {
				// Read file as ArrayBuffer (more reliable than blob URL for pdfjs)
				const arrayBuffer = await file.arrayBuffer();

				const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
				pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

				const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
				const page = await pdf.getPage(1);
				const viewport = page.getViewport({ scale: 1 });

				const maxW = 400;
				const scale = Math.min(maxW / viewport.width, 1);
				const scaledViewport = page.getViewport({ scale });

				const canvas = document.createElement("canvas");
				canvas.width = scaledViewport.width;
				canvas.height = scaledViewport.height;
				await page.render({ canvasContext: canvas.getContext("2d"), viewport: scaledViewport }).promise;

				this.videoThumbnail = canvas.toDataURL("image/jpeg", 0.8);
				await new Promise((resolve) => {
					canvas.toBlob((blob) => {
						this.thumbnailBlob = blob;
						resolve();
					}, "image/jpeg", 0.8);
				});

				pdf.destroy();
			} catch (e) {
				console.warn("PDF thumbnail generation failed:", e);
			}
		},

		capturePreviewFrame() {
			// Kept as fallback for hidden video element
			try {
				const video = this.$refs.hiddenVideo;
				if (!video || video.videoWidth === 0) return;
				const canvas = document.createElement("canvas");
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				canvas.getContext("2d").drawImage(video, 0, 0);
				this.videoThumbnail = canvas.toDataURL("image/jpeg", 0.7);
			} catch {}
		},

		formatSize(bytes) {
			if (!bytes) return "";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1048576).toFixed(1)} MB`;
		},

		async startRecording() {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				this.mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
				this.audioChunks = [];

				this.mediaRecorder.ondataavailable = (e) => {
					if (e.data.size > 0) this.audioChunks.push(e.data);
				};

				this.mediaRecorder.onstop = () => {
					stream.getTracks().forEach((t) => t.stop());
				};

				this.mediaRecorder.start();
				this.isRecording = true;
				this.recordingStart = Date.now();

				this.recordingTimer = setInterval(() => {
					const elapsed = Math.floor((Date.now() - this.recordingStart) / 1000);
					const mins = Math.floor(elapsed / 60);
					const secs = elapsed % 60;
					this.recordingDuration = `${mins}:${secs.toString().padStart(2, "0")}`;

					// Max 5 minutes
					if (elapsed >= 300) this.stopRecording();
				}, 1000);
			} catch (err) {
				console.error("Microphone access denied:", err);
			}
		},

		stopRecording() {
			if (!this.mediaRecorder) return;

			this.mediaRecorder.onstop = () => {
				this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
				const blob = new Blob(this.audioChunks, { type: "audio/webm" });
				const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
				const durationSeconds = Math.floor((Date.now() - this.recordingStart) / 1000);

				this.$emit("send-attachment", {
					file,
					type: "voice_note",
					durationSeconds,
				});

				this.cleanupRecording();
			};

			this.mediaRecorder.stop();
		},

		cancelRecording() {
			if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
				this.mediaRecorder.onstop = () => {
					this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
				};
				this.mediaRecorder.stop();
			}
			this.cleanupRecording();
		},

		cleanupRecording() {
			clearInterval(this.recordingTimer);
			this.isRecording = false;
			this.mediaRecorder = null;
			this.audioChunks = [];
			this.recordingStart = null;
			this.recordingDuration = "0:00";
		},
	},
};
</script>

<style scoped lang="scss">
.chat-input-container {
	border-top: 1px solid #e2e8f0;
	background: rgba(255, 255, 255, 0.9);
}

.pending-attachment {
	padding: 12px 16px 0;
}

.attachment-preview-card {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	background: #f1f5f9;
	border-radius: 10px;
	padding: 8px 12px;
	position: relative;
}

.attachment-preview-card {
	&.has-thumbnail {
		flex-direction: column;
		gap: 4px;
		padding: 6px;
		max-width: 200px;
		position: relative;
	}
}

.image-preview {
	width: 100%;
	max-height: 160px;
	object-fit: cover;
	border-radius: 6px;
}

.video-preview-wrapper {
	position: relative;
	border-radius: 6px;
	overflow: hidden;

	.video-preview {
		width: 100%;
		max-height: 160px;
		object-fit: cover;
		display: block;
		border-radius: 6px;
	}

	.video-preview-placeholder {
		width: 180px;
		height: 100px;
		background: #1e293b;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-play-badge {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.pdf-preview-wrapper {
	border-radius: 6px;
	overflow: hidden;
	max-height: 180px;
}

.preview-info-bar {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 2px 4px;
}

.preview-type-badge {
	font-size: 10px;
	font-weight: 600;
	padding: 1px 6px;
	border-radius: 3px;
	letter-spacing: 0.3px;

	&.badge-pdf {
		background: #fef2f2;
		color: #ef4444;
	}
	&.badge-video {
		background: #f0f9ff;
		color: #0284c7;
	}
	&.badge-image {
		background: #f0fdf4;
		color: #16a34a;
	}
}

.preview-file-size {
	font-size: 11px;
	color: #94a3b8;
}

.file-preview {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	color: #334155;
}

.file-details {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.file-detail-name {
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 13px;
}

.file-detail-size {
	font-size: 11px;
	color: #94a3b8;
}

.mini-spinner {
	width: 20px;
	height: 20px;
	border: 2px solid rgba(255, 255, 255, 0.2);
	border-top-color: white;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.remove-attachment {
	position: absolute;
	top: 4px;
	right: 4px;
	background: rgba(0, 0, 0, 0.4);
	border: none;
	cursor: pointer;
	color: white;
	padding: 2px;
	border-radius: 50%;
	width: 22px;
	height: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1;
	transition: background 0.15s;

	&:hover {
		background: rgba(0, 0, 0, 0.6);
	}

	.attachment-preview-card:not(.has-thumbnail) & {
		position: static;
		background: none;
		color: #94a3b8;
		width: auto;
		height: auto;
		border-radius: 0;
	}
}

.input-bar {
	display: flex;
	align-items: flex-end;
	gap: 8px;
	padding: 12px 16px;
}

.btn-attach,
.btn-voice {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: none;
	background: #f1f5f9;
	color: #64748b;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: background 0.15s;

	&:hover {
		background: #e2e8f0;
		color: #4FC3F7;
	}
}

.text-input-wrapper {
	flex: 1;
	min-width: 0;

	textarea {
		width: 100%;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		padding: 8px 16px;
		font-size: 14px;
		color: #334155;
		resize: none;
		outline: none;
		line-height: 1.5;
		max-height: 120px;
		font-family: inherit;
		transition: border-color 0.2s;

		&:focus {
			border-color: #4FC3F7;
		}

		&::placeholder {
			color: #94a3b8;
		}
	}
}

.btn-send {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: opacity 0.15s, transform 0.15s;

	&:disabled {
		opacity: 0.4;
		cursor: default;
	}

	&:not(:disabled):hover {
		transform: scale(1.05);
	}
}

// Recording UI
.recording-ui {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
}

.recording-indicator {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
	font-size: 14px;
	color: #ef4444;
	font-weight: 500;
}

.rec-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #ef4444;
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}

.btn-cancel-record {
	background: none;
	border: none;
	color: #94a3b8;
	font-size: 14px;
	cursor: pointer;
}

.btn-send-record {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}
</style>
