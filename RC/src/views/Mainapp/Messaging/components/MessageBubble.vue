<template>
	<div class="message-row" :class="{ mine: isMine, deleted: message.is_deleted }">
		<!-- Reply indicator -->
		<div v-if="message.reply_to" class="reply-preview" :class="{ mine: isMine }">
			<span>{{ message.reply_to.content?.substring(0, 60) || 'Attachment' }}</span>
		</div>

		<div class="bubble" :class="bubbleClass">
			<!-- System message -->
			<template v-if="message.type === 'system'">
				<div class="system-message">{{ message.content }}</div>
			</template>

			<!-- Text message -->
			<template v-else-if="message.type === 'text'">
				<p class="message-text" v-html="message.is_deleted ? 'This message was deleted' : linkifyContent(message.content)"></p>

				<!-- Link previews -->
				<div v-if="message.link_previews?.length" class="link-previews">
					<div
						v-for="(preview, i) in message.link_previews"
						:key="i"
						class="link-preview-card"
						@click="openLink(preview)"
					>
						<!-- YouTube / video embed -->
						<div v-if="preview.video_embed_url && youtubeEmbedActive === i" class="video-embed">
							<iframe
								:src="preview.video_embed_url + '?autoplay=1'"
								frameborder="0"
								allow="autoplay; encrypted-media"
								allowfullscreen
							></iframe>
						</div>
						<div v-else-if="preview.image" class="preview-image-wrapper" @click.stop="preview.video_embed_url ? youtubeEmbedActive = i : openLink(preview)">
							<img :src="preview.image" class="preview-image" loading="lazy" @error="$event.target.style.display='none'" />
							<div v-if="preview.video_embed_url" class="preview-play-btn">
								<svg width="36" height="36" viewBox="0 0 24 24" fill="white" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.4))">
									<path d="M8 5v14l11-7z" />
								</svg>
							</div>
						</div>
						<div class="preview-body">
							<span v-if="preview.domain" class="preview-domain">{{ preview.domain }}</span>
							<span v-if="preview.title" class="preview-title">{{ preview.title }}</span>
							<span v-if="preview.description" class="preview-description">{{ preview.description }}</span>
						</div>
					</div>
				</div>
			</template>

			<!-- Image -->
			<template v-else-if="message.type === 'image'">
				<div class="attachment-image" @click="viewMedia(message.attachments[0])">
					<img :src="message.attachments[0]?.url" :alt="message.attachments[0]?.original_name" loading="lazy" />
				</div>
				<p v-if="message.content" class="message-text caption">{{ message.content }}</p>
			</template>

			<!-- Video -->
			<template v-else-if="message.type === 'video'">
				<div class="attachment-video" @click="viewMedia(message.attachments[0])">
					<!-- Thumbnail preview if available -->
					<img v-if="message.attachments[0]?.thumbnail_url" :src="message.attachments[0].thumbnail_url" class="video-thumb-img" />
					<!-- Fallback placeholder -->
					<div v-else class="video-placeholder">
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
							<polygon points="23 7 16 12 23 17 23 7" />
							<rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
						</svg>
					</div>
					<div class="play-overlay">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
							<path d="M8 5v14l11-7z" />
						</svg>
					</div>
					<div class="video-file-bar">
						<span class="video-file-name">{{ message.attachments[0]?.original_name }}</span>
						<span class="video-file-size" v-if="message.attachments[0]?.size_bytes">{{ formatSize(message.attachments[0].size_bytes) }}</span>
					</div>
					<div class="video-duration" v-if="message.attachments[0]?.duration_seconds">
						{{ formatDuration(message.attachments[0].duration_seconds) }}
					</div>
				</div>
				<p v-if="message.content" class="message-text caption">{{ message.content }}</p>
			</template>

			<!-- Voice note -->
			<template v-else-if="message.type === 'voice_note'">
				<div class="voice-note">
					<button class="play-btn" @click="toggleAudio">
						<svg v-if="!isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8 5v14l11-7z" />
						</svg>
						<svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
						</svg>
					</button>
					<div class="waveform">
						<div
							v-for="(h, i) in voiceWaveformBars"
							:key="i"
							class="bar"
							:class="{ 'bar-played': audioProgress > (i / voiceWaveformBars.length) }"
							:style="{ height: h + '%' }"
						></div>
					</div>
					<span class="duration">{{ isPlaying ? audioCurrentTime : formatDuration(message.attachments[0]?.duration_seconds) }}</span>
					<button class="voice-download-btn" @click.stop="$emit('download', { conversationId: message.conversation_id, messageId: message._id, attachment: message.attachments[0] })" title="Download">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
						</svg>
					</button>
				</div>
			</template>

			<!-- PDF file -->
			<template v-else-if="isPdf">
				<!-- PDF with thumbnail preview -->
				<div v-if="message.attachments[0]?.thumbnail_url" class="attachment-pdf-thumb" @click="viewMedia(message.attachments[0])">
					<img :src="message.attachments[0].thumbnail_url" class="pdf-thumb-img" />
					<div class="pdf-thumb-overlay">
						<span class="pdf-thumb-badge">PDF</span>
					</div>
					<div class="pdf-thumb-bar">
						<span class="pdf-thumb-name">{{ message.attachments[0]?.original_name }}</span>
						<span class="pdf-thumb-size">{{ formatSize(message.attachments[0]?.size_bytes) }}</span>
					</div>
				</div>
				<!-- Fallback PDF card (no thumbnail) -->
				<div v-else class="attachment-pdf-card" @click="viewMedia(message.attachments[0])">
					<div class="pdf-card-icon">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
						</svg>
						<span class="pdf-badge">PDF</span>
					</div>
					<div class="pdf-card-info">
						<span class="pdf-card-name">{{ message.attachments[0]?.original_name }}</span>
						<span class="pdf-card-size">{{ formatSize(message.attachments[0]?.size_bytes) }}</span>
					</div>
				</div>
				<p v-if="message.content" class="message-text caption">{{ message.content }}</p>
			</template>

			<!-- Other files -->
			<template v-else-if="message.type === 'file'">
				<div class="attachment-file" @click="$emit('download', message.attachments[0])">
					<div class="file-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
						</svg>
					</div>
					<div class="file-info">
						<span class="file-name">{{ message.attachments[0]?.original_name }}</span>
						<span class="file-size">{{ formatSize(message.attachments[0]?.size_bytes) }}</span>
					</div>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="download-icon">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
				</div>
				<p v-if="message.content" class="message-text caption">{{ message.content }}</p>
			</template>

			<!-- Message meta -->
			<div v-if="message.type !== 'system'" class="message-meta">
				<span class="msg-time">{{ formatTime(message.created_at || message.status?.sent_at) }}</span>
				<span v-if="isMine" class="msg-status">
					<template v-if="message.status?.read_at">
						<svg width="16" height="10" viewBox="0 0 16 10" class="read">
							<path d="M1 5l3 3 7-7" stroke="currentColor" stroke-width="1.5" fill="none" />
							<path d="M5 5l3 3 7-7" stroke="currentColor" stroke-width="1.5" fill="none" />
						</svg>
					</template>
					<template v-else-if="message.status?.delivered_at">
						<svg width="16" height="10" viewBox="0 0 16 10" class="delivered">
							<path d="M1 5l3 3 7-7" stroke="currentColor" stroke-width="1.5" fill="none" />
							<path d="M5 5l3 3 7-7" stroke="currentColor" stroke-width="1.5" fill="none" />
						</svg>
					</template>
					<template v-else>
						<svg width="12" height="10" viewBox="0 0 12 10" class="sent">
							<path d="M1 5l3 3 7-7" stroke="currentColor" stroke-width="1.5" fill="none" />
						</svg>
					</template>
				</span>
			</div>
		</div>

		<!-- Context menu (delete) -->
		<button v-if="isMine && !message.is_deleted" class="delete-btn" @click="$emit('delete')" title="Delete">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			</svg>
		</button>
	</div>
</template>

<script>
export default {
	props: {
		message: { type: Object, required: true },
		isMine: { type: Boolean, default: false },
	},

	emits: ["delete", "download", "view-media"],

	data() {
		return {
			isPlaying: false,
			audio: null,
			audioProgress: 0,
			audioCurrentTime: "0:00",
			voiceWaveformBars: this.generateWaveformBars(),
			youtubeEmbedActive: null,
		};
	},

	computed: {
		bubbleClass() {
			return {
				mine: this.isMine,
				theirs: !this.isMine,
				system: this.message.type === "system",
				deleted: this.message.is_deleted,
			};
		},
		isPdf() {
			if (this.message.type !== "file") return false;
			const attachment = this.message.attachments?.[0];
			if (!attachment) return false;
			return (
				attachment.mime_type === "application/pdf" ||
				attachment.original_name?.toLowerCase().endsWith(".pdf")
			);
		},
	},

	beforeUnmount() {
		if (this.audio) {
			this.audio.pause();
			this.audio = null;
		}
	},

	methods: {
		linkifyContent(text) {
			if (!text) return "";
			// Escape HTML first, then convert URLs to links
			const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			return escaped.replace(
				/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g,
				'<a href="$1" target="_blank" rel="noopener" class="msg-link" @click.stop>$1</a>'
			);
		},
		openLink(preview) {
			if (preview?.url) {
				window.open(preview.url, "_blank", "noopener");
			}
		},
		formatTime(dateStr) {
			if (!dateStr) return "";
			return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		},
		formatSize(bytes) {
			if (!bytes) return "";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1048576).toFixed(1)} MB`;
		},
		formatDuration(seconds) {
			if (!seconds) return "0:00";
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return `${mins}:${secs.toString().padStart(2, "0")}`;
		},
		viewMedia(attachment) {
			this.$emit("view-media", { ...attachment, _messageId: this.message._id });
		},
		generateWaveformBars() {
			// Generate deterministic-looking waveform based on message id
			const bars = [];
			const seed = (this.message?._id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
			for (let i = 0; i < 28; i++) {
				const pseudo = Math.sin(seed * (i + 1) * 0.3) * 0.5 + 0.5;
				bars.push(Math.max(20, pseudo * 90));
			}
			return bars;
		},
		toggleAudio() {
			const url = this.message.attachments?.[0]?.url;
			if (!url) return;

			if (this.isPlaying) {
				this.audio?.pause();
				this.isPlaying = false;
			} else {
				// Destroy old audio if it ended (WebM can't seek on presigned URLs)
				if (this.audio && this.audio.ended) {
					this.audio.pause();
					this.audio.src = "";
					this.audio = null;
				}
				if (!this.audio) {
					this.audioProgress = 0;
					this.audioCurrentTime = "0:00";
					this.audio = new Audio(url);
					this.audio.addEventListener("ended", () => {
						this.isPlaying = false;
						this.audioProgress = 1;
					});
					this.audio.addEventListener("timeupdate", () => {
						if (this.audio && this.audio.duration) {
							this.audioProgress = this.audio.currentTime / this.audio.duration;
							const secs = Math.floor(this.audio.currentTime);
							const m = Math.floor(secs / 60);
							const s = secs % 60;
							this.audioCurrentTime = `${m}:${s.toString().padStart(2, "0")}`;
						}
					});
				}
				this.audio.play();
				this.isPlaying = true;
			}
		},
	},
};
</script>

<style scoped lang="scss">
.message-row {
	display: flex;
	align-items: flex-end;
	gap: 6px;
	margin-bottom: 2px;

	&.mine {
		flex-direction: row-reverse;
	}
}

.bubble {
	max-width: 70%;
	padding: 10px 14px;
	border-radius: 16px;
	position: relative;
	word-break: break-word;

	&.mine {
		background: linear-gradient(135deg, #4FC3F7, #29B6F6);
		color: white;
		border-bottom-right-radius: 4px;
	}

	&.theirs {
		background: white;
		color: #334155;
		border: 1px solid #e2e8f0;
		border-bottom-left-radius: 4px;
	}

	&.system {
		max-width: 80%;
		background: transparent;
		text-align: center;
		color: #94a3b8;
		font-size: 12px;
		padding: 8px;
		margin: 0 auto;
	}

	&.deleted {
		opacity: 0.6;
		font-style: italic;
	}
}

.message-text {
	font-size: 14px;
	line-height: 1.5;
	margin: 0;
	white-space: pre-wrap;

	&.caption {
		margin-top: 6px;
	}

	:deep(.msg-link) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
		word-break: break-all;

		.mine & { color: rgba(255,255,255,0.9); }
		.theirs & { color: #0284c7; }
	}
}

// Link previews
.link-previews {
	margin-top: 8px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.link-preview-card {
	border-radius: 8px;
	overflow: hidden;
	cursor: pointer;
	transition: opacity 0.15s;
	max-width: 320px;

	.mine & {
		background: rgba(255,255,255,0.15);
	}
	.theirs & {
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
	}

	&:hover { opacity: 0.9; }
}

.preview-image-wrapper {
	position: relative;
	width: 100%;
	max-height: 180px;
	overflow: hidden;

	.preview-image {
		width: 100%;
		height: auto;
		max-height: 180px;
		object-fit: cover;
		display: block;
	}
}

.preview-play-btn {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 52px;
	height: 52px;
	border-radius: 50%;
	background: rgba(255,0,0,0.85);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.15s;

	&:hover { transform: translate(-50%, -50%) scale(1.1); }
}

.video-embed {
	position: relative;
	width: 100%;
	padding-top: 56.25%; // 16:9 aspect ratio

	iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
	}
}

.preview-body {
	padding: 8px 10px;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.preview-domain {
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.3px;

	.mine & { color: rgba(255,255,255,0.6); }
	.theirs & { color: #94a3b8; }
}

.preview-title {
	font-size: 13px;
	font-weight: 600;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;

	.mine & { color: white; }
	.theirs & { color: #1e293b; }
}

.preview-description {
	font-size: 12px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;

	.mine & { color: rgba(255,255,255,0.7); }
	.theirs & { color: #64748b; }
}

.reply-preview {
	font-size: 11px;
	padding: 4px 10px;
	margin-bottom: 2px;
	border-left: 3px solid #4FC3F7;
	background: rgba(79, 195, 247, 0.08);
	border-radius: 4px;
	color: #64748b;

	&.mine {
		margin-left: auto;
	}
}

// Attachments
.attachment-image {
	border-radius: 8px;
	overflow: hidden;
	cursor: pointer;
	max-width: 280px;

	img {
		width: 100%;
		display: block;
		border-radius: 8px;
	}
}

.attachment-video {
	position: relative;
	border-radius: 8px;
	overflow: hidden;
	cursor: pointer;
	max-width: 280px;

	.video-thumb-img {
		width: 100%;
		display: block;
		min-height: 100px;
		object-fit: cover;
	}

	.video-placeholder {
		width: 100%;
		height: 140px;
		background: linear-gradient(135deg, #1e293b, #334155);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.play-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.2);
		transition: background 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.4);
		}
	}

	.video-file-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 6px 10px;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		color: white;
	}

	.video-file-name {
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.video-file-size {
		font-size: 10px;
		opacity: 0.8;
		flex-shrink: 0;
	}

	.video-duration {
		position: absolute;
		top: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 11px;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 4px;
	}
}

.attachment-pdf-card {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 8px;
	cursor: pointer;
	min-width: 220px;
	max-width: 280px;
	background: rgba(239, 68, 68, 0.12);
	border: 1px solid rgba(239, 68, 68, 0.2);
	transition: background 0.15s;

	.theirs & {
		background: #fef2f2;
		border-color: #fecaca;
	}

	&:hover {
		background: rgba(239, 68, 68, 0.2);
		.theirs & {
			background: #fee2e2;
		}
	}
}

.pdf-card-icon {
	position: relative;
	width: 44px;
	height: 44px;
	border-radius: 8px;
	background: #ef4444;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.pdf-badge {
	position: absolute;
	bottom: -2px;
	right: -4px;
	font-size: 8px;
	font-weight: 800;
	color: white;
	background: #dc2626;
	padding: 1px 4px;
	border-radius: 3px;
	letter-spacing: 0.5px;
}

.pdf-card-info {
	flex: 1;
	min-width: 0;
}

.pdf-card-name {
	font-size: 13px;
	font-weight: 500;
	display: block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pdf-card-size {
	font-size: 11px;
	opacity: 0.6;
	display: block;
	margin-top: 2px;
}

.attachment-pdf-thumb {
	position: relative;
	border-radius: 8px;
	overflow: hidden;
	cursor: pointer;
	max-width: 280px;

	.pdf-thumb-img {
		width: 100%;
		display: block;
		min-height: 80px;
	}

	.pdf-thumb-overlay {
		position: absolute;
		top: 8px;
		left: 8px;
	}

	.pdf-thumb-badge {
		background: #ef4444;
		color: white;
		font-size: 10px;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 4px;
		letter-spacing: 0.5px;
	}

	.pdf-thumb-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 6px 10px;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
		color: white;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.pdf-thumb-name {
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.pdf-thumb-size {
		font-size: 10px;
		opacity: 0.8;
		flex-shrink: 0;
	}
}

.voice-note {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 220px;
}

.play-btn {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	border: none;
	background: rgba(255, 255, 255, 0.25);
	color: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: background 0.15s;

	&:hover {
		background: rgba(255, 255, 255, 0.35);
	}

	.theirs & {
		background: rgba(0, 0, 0, 0.08);
		&:hover { background: rgba(0, 0, 0, 0.12); }
	}
}

.waveform {
	display: flex;
	align-items: center;
	gap: 2px;
	height: 28px;
	flex: 1;
}

.bar {
	width: 3px;
	background: currentColor;
	opacity: 0.4;
	border-radius: 2px;
	transition: opacity 0.15s;

	&.bar-played {
		opacity: 1;
	}
}

.duration {
	font-size: 11px;
	opacity: 0.8;
	flex-shrink: 0;
	font-variant-numeric: tabular-nums;
	min-width: 28px;
	text-align: right;
}

.voice-download-btn {
	width: 26px;
	height: 26px;
	border-radius: 50%;
	border: none;
	background: rgba(255, 255, 255, 0.2);
	color: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	opacity: 0.6;
	transition: opacity 0.15s, background 0.15s;

	&:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
	}

	.theirs & {
		background: rgba(0, 0, 0, 0.06);
		&:hover { background: rgba(0, 0, 0, 0.1); }
	}
}

.attachment-file {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 12px;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 8px;
	cursor: pointer;
	min-width: 180px;

	.theirs & {
		background: #f8fafc;
	}
}

.file-icon {
	flex-shrink: 0;
	opacity: 0.8;
}

.file-info {
	flex: 1;
	min-width: 0;
}

.file-name {
	font-size: 13px;
	font-weight: 500;
	display: block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.file-size {
	font-size: 11px;
	opacity: 0.7;
}

.download-icon {
	flex-shrink: 0;
	opacity: 0.6;
}

// Meta
.message-meta {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	margin-top: 4px;
}

.msg-time {
	font-size: 10px;
	opacity: 0.7;
}

.msg-status {
	display: flex;
	align-items: center;

	.sent { color: rgba(255, 255, 255, 0.6); }
	.delivered { color: rgba(255, 255, 255, 0.8); }
	.read { color: #81D4FA; }

	.theirs & {
		.sent { color: #94a3b8; }
		.delivered { color: #64748b; }
		.read { color: #4FC3F7; }
	}
}

.delete-btn {
	opacity: 0;
	background: none;
	border: none;
	cursor: pointer;
	color: #94a3b8;
	padding: 4px;
	transition: opacity 0.15s;

	.message-row:hover & {
		opacity: 1;
	}
}
</style>
