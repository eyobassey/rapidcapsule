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
			<button class="btn-cancel-record" @click="cancelRecording" title="Cancel">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
			<div class="recording-waveform-area">
				<span class="rec-dot"></span>
				<canvas ref="waveformCanvas" class="waveform-canvas" width="200" height="36"></canvas>
				<span class="recording-time">{{ recordingDuration }}</span>
			</div>
			<button class="btn-stop-record" @click="stopRecording" title="Stop recording">
				<div class="stop-icon"></div>
			</button>
		</div>

		<!-- Voice note preview (after recording, before sending) -->
		<div v-else-if="recordedAudio" class="voice-preview-ui">
			<button class="btn-delete-recording" @click="discardRecording" title="Delete">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
			</button>
			<div class="preview-waveform-area">
				<button class="btn-play-preview" @click="togglePreviewPlayback">
					<svg v-if="!isPreviewPlaying" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8 5v14l11-7z" />
					</svg>
					<svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
					</svg>
				</button>
				<div class="preview-bars">
					<div
						v-for="(h, i) in recordedWaveform"
						:key="i"
						class="preview-bar"
						:class="{ played: previewProgress > i / recordedWaveform.length }"
						:style="{ height: h + '%' }"
					></div>
				</div>
				<span class="preview-time">{{ isPreviewPlaying ? previewCurrentTime : recordingDuration }}</span>
			</div>
			<button class="btn-send-record" @click="sendRecording" title="Send">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
					<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
				</svg>
			</button>
		</div>

		<!-- Blocked banner -->
		<div v-else-if="isBlocked" class="restriction-banner restriction-blocked">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
			</svg>
			<span>You have been blocked from messaging. Contact support for assistance.</span>
		</div>

		<!-- Read-only / Cap reached input bar -->
		<div v-else-if="isReadOnly || isCapReached" class="input-bar input-bar-restricted">
			<div class="text-input-wrapper">
				<textarea
					disabled
					:placeholder="restrictionPlaceholder"
					rows="1"
				></textarea>
			</div>
			<div v-if="capDisplay" class="cap-counter">{{ capDisplay }}</div>
		</div>

		<!-- Normal input bar -->
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

			<div v-if="capDisplay" class="cap-counter">{{ capDisplay }}</div>
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

	props: {
		restriction: {
			type: Object,
			default: () => ({ status: "none" }),
		},
	},

	emits: ["send", "send-attachment", "typing"],

	beforeUnmount() {
		this.cancelRecording();
		this.discardRecording();
	},

	data() {
		return {
			text: "",
			pendingFile: null,
			previewUrl: null,
			videoThumbnail: null,
			thumbnailBlob: null,
			thumbnailPromise: null,
			isSending: false,
			// Recording state
			isRecording: false,
			mediaRecorder: null,
			audioChunks: [],
			recordingStart: null,
			recordingTimer: null,
			recordingDuration: "0:00",
			audioContext: null,
			analyser: null,
			waveformRaf: null,
			// Preview state (after recording, before send)
			recordedAudio: null, // { blob, file, durationSeconds }
			recordedWaveform: [], // Array of bar heights (0–100)
			isPreviewPlaying: false,
			previewPlayer: null,
			previewProgress: 0,
			previewCurrentTime: "0:00",
			waveformSamples: [],
		};
	},

	computed: {
		isBlocked() {
			return this.restriction?.status === "blocked";
		},
		isReadOnly() {
			return this.restriction?.status === "read_only";
		},
		isCapReached() {
			const cap = this.restriction?.message_cap;
			if (!cap?.enabled || !cap.limit) return false;
			return (cap.current_count || 0) >= cap.limit;
		},
		isRestricted() {
			return this.isBlocked || this.isReadOnly || this.isCapReached;
		},
		restrictionPlaceholder() {
			if (this.isBlocked) return "You have been blocked from messaging.";
			if (this.isReadOnly) return "You are restricted from sending messages.";
			if (this.isCapReached) {
				const cap = this.restriction.message_cap;
				const period = cap.period === "daily" ? "daily" : "monthly";
				return `You have reached your ${period} message limit.`;
			}
			return "Type a message...";
		},
		capDisplay() {
			const cap = this.restriction?.message_cap;
			if (!cap?.enabled || !cap.limit) return null;
			const period = cap.period === "daily" ? "today" : "this month";
			return `${cap.current_count || 0}/${cap.limit} messages ${period}`;
		},
		canSend() {
			if (this.isRestricted) return false;
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

				// Set up Web Audio API analyser for waveform
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
				const source = this.audioContext.createMediaStreamSource(stream);
				this.analyser = this.audioContext.createAnalyser();
				this.analyser.fftSize = 256;
				source.connect(this.analyser);

				this.mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
				this.audioChunks = [];
				this.waveformSamples = [];

				this.mediaRecorder.ondataavailable = (e) => {
					if (e.data.size > 0) this.audioChunks.push(e.data);
				};

				this.mediaRecorder.start(100); // collect data every 100ms
				this.isRecording = true;
				this.recordingStart = Date.now();

				// Start timer
				this.recordingTimer = setInterval(() => {
					const elapsed = Math.floor((Date.now() - this.recordingStart) / 1000);
					const mins = Math.floor(elapsed / 60);
					const secs = elapsed % 60;
					this.recordingDuration = `${mins}:${secs.toString().padStart(2, "0")}`;
					if (elapsed >= 300) this.stopRecording();
				}, 1000);

				// Start waveform animation
				this.$nextTick(() => this.drawWaveform());
			} catch (err) {
				console.error("Microphone access denied:", err);
			}
		},

		drawWaveform() {
			if (!this.isRecording || !this.analyser) return;

			const canvas = this.$refs.waveformCanvas;
			if (!canvas) { this.waveformRaf = requestAnimationFrame(() => this.drawWaveform()); return; }

			const ctx = canvas.getContext("2d");
			const bufferLength = this.analyser.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);
			this.analyser.getByteFrequencyData(dataArray);

			// Calculate average amplitude
			let sum = 0;
			for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
			const avg = sum / bufferLength;
			this.waveformSamples.push(Math.min(100, (avg / 128) * 100));

			const w = canvas.width;
			const h = canvas.height;
			ctx.clearRect(0, 0, w, h);

			// Draw live waveform bars (scrolling right-to-left)
			const barWidth = 3;
			const gap = 2;
			const totalBarWidth = barWidth + gap;
			const maxBars = Math.floor(w / totalBarWidth);
			const samples = this.waveformSamples.slice(-maxBars);

			ctx.fillStyle = "#ef4444";
			for (let i = 0; i < samples.length; i++) {
				const barH = Math.max(3, (samples[i] / 100) * h * 0.85);
				const x = i * totalBarWidth;
				const y = (h - barH) / 2;
				const r = Math.min(1.5, barWidth / 2, barH / 2);
				if (ctx.roundRect) {
					ctx.beginPath();
					ctx.roundRect(x, y, barWidth, barH, r);
					ctx.fill();
				} else {
					ctx.fillRect(x, y, barWidth, barH);
				}
			}

			this.waveformRaf = requestAnimationFrame(() => this.drawWaveform());
		},

		stopRecording() {
			if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") return;

			this.mediaRecorder.onstop = () => {
				this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());

				const blob = new Blob(this.audioChunks, { type: "audio/webm" });
				const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
				const durationSeconds = Math.floor((Date.now() - this.recordingStart) / 1000);

				// Build waveform from samples for preview
				const maxBars = 40;
				const samples = this.waveformSamples;
				const waveform = [];
				if (samples.length <= maxBars) {
					for (const s of samples) waveform.push(Math.max(15, s));
				} else {
					const step = samples.length / maxBars;
					for (let i = 0; i < maxBars; i++) {
						const idx = Math.floor(i * step);
						const end = Math.min(Math.floor((i + 1) * step), samples.length);
						let sum = 0;
						for (let j = idx; j < end; j++) sum += samples[j];
						waveform.push(Math.max(15, sum / (end - idx)));
					}
				}

				this.recordedAudio = { blob, file, durationSeconds };
				this.recordedWaveform = waveform;

				// Cleanup recording state but keep preview
				this.stopRecordingCleanup();
			};

			this.mediaRecorder.stop();
		},

		stopRecordingCleanup() {
			cancelAnimationFrame(this.waveformRaf);
			clearInterval(this.recordingTimer);
			if (this.audioContext) {
				this.audioContext.close().catch(() => {});
				this.audioContext = null;
			}
			this.analyser = null;
			this.isRecording = false;
			this.mediaRecorder = null;
			this.audioChunks = [];
		},

		cancelRecording() {
			if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
				this.mediaRecorder.onstop = () => {
					this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
				};
				this.mediaRecorder.stop();
			}
			cancelAnimationFrame(this.waveformRaf);
			clearInterval(this.recordingTimer);
			if (this.audioContext) {
				this.audioContext.close().catch(() => {});
				this.audioContext = null;
			}
			this.analyser = null;
			this.isRecording = false;
			this.mediaRecorder = null;
			this.audioChunks = [];
			this.waveformSamples = [];
			this.recordingStart = null;
			this.recordingDuration = "0:00";
		},

		togglePreviewPlayback() {
			if (!this.recordedAudio) return;

			if (this.isPreviewPlaying && this.previewPlayer) {
				this.previewPlayer.pause();
				this.isPreviewPlaying = false;
				return;
			}

			if (!this.previewPlayer) {
				this.previewPlayer = new Audio(URL.createObjectURL(this.recordedAudio.blob));
				this.previewPlayer.addEventListener("ended", () => {
					this.isPreviewPlaying = false;
					this.previewProgress = 0;
					this.previewCurrentTime = "0:00";
				});
				this.previewPlayer.addEventListener("timeupdate", () => {
					if (this.previewPlayer.duration) {
						this.previewProgress = this.previewPlayer.currentTime / this.previewPlayer.duration;
						const secs = Math.floor(this.previewPlayer.currentTime);
						const m = Math.floor(secs / 60);
						const s = secs % 60;
						this.previewCurrentTime = `${m}:${s.toString().padStart(2, "0")}`;
					}
				});
			}

			this.previewPlayer.play();
			this.isPreviewPlaying = true;
		},

		sendRecording() {
			if (!this.recordedAudio) return;

			this.$emit("send-attachment", {
				file: this.recordedAudio.file,
				type: "voice_note",
				durationSeconds: this.recordedAudio.durationSeconds,
			});

			this.discardRecording();
		},

		discardRecording() {
			if (this.previewPlayer) {
				this.previewPlayer.pause();
				const src = this.previewPlayer.src;
				this.previewPlayer = null;
				if (src) URL.revokeObjectURL(src);
			}
			this.recordedAudio = null;
			this.recordedWaveform = [];
			this.isPreviewPlaying = false;
			this.previewProgress = 0;
			this.previewCurrentTime = "0:00";
			this.waveformSamples = [];
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

// Restriction styles
.restriction-banner {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 16px;
	font-size: 13px;
	color: #64748b;

	&.restriction-blocked {
		background: #fef2f2;
		border-top: 1px solid #fecaca;
		color: #dc2626;
	}
}

.input-bar-restricted {
	opacity: 0.6;

	textarea {
		cursor: not-allowed;
		background: #f8fafc;
	}
}

.cap-counter {
	font-size: 11px;
	color: #94a3b8;
	white-space: nowrap;
	padding: 0 4px;
	flex-shrink: 0;
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
	gap: 10px;
	padding: 10px 16px;
	background: #fef2f2;
	border-top: 1px solid #fecaca;
}

.recording-waveform-area {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.waveform-canvas {
	flex: 1;
	height: 36px;
	border-radius: 4px;
}

.recording-time {
	font-size: 13px;
	font-weight: 600;
	color: #ef4444;
	font-variant-numeric: tabular-nums;
	min-width: 36px;
	text-align: right;
}

.rec-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #ef4444;
	flex-shrink: 0;
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}

.btn-cancel-record {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	border: none;
	background: #fee2e2;
	color: #ef4444;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: background 0.15s;

	&:hover {
		background: #fecaca;
	}
}

.btn-stop-record {
	width: 38px;
	height: 38px;
	border-radius: 50%;
	border: none;
	background: #ef4444;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: transform 0.15s;

	&:hover {
		transform: scale(1.05);
	}

	.stop-icon {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		background: white;
	}
}

// Voice preview UI
.voice-preview-ui {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 16px;
	background: #f0f9ff;
	border-top: 1px solid #bae6fd;
}

.btn-delete-recording {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	border: none;
	background: #fee2e2;
	color: #ef4444;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: background 0.15s;

	&:hover {
		background: #fecaca;
	}
}

.preview-waveform-area {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 8px;
	background: white;
	border-radius: 20px;
	padding: 6px 12px;
	border: 1px solid #e0f2fe;
	min-width: 0;
}

.btn-play-preview {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: transform 0.15s;

	&:hover {
		transform: scale(1.05);
	}
}

.preview-bars {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 2px;
	height: 28px;
	min-width: 0;
}

.preview-bar {
	flex: 1;
	min-width: 2px;
	max-width: 4px;
	border-radius: 2px;
	background: #cbd5e1;
	transition: background 0.15s;

	&.played {
		background: #4FC3F7;
	}
}

.preview-time {
	font-size: 12px;
	font-weight: 500;
	color: #64748b;
	font-variant-numeric: tabular-nums;
	min-width: 32px;
	text-align: right;
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
	flex-shrink: 0;
	transition: transform 0.15s;

	&:hover {
		transform: scale(1.05);
	}
}
</style>
