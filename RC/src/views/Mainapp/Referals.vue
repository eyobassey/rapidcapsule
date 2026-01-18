<template>
	<div class="referrals-page">
		<TopBar
			type="title-only"
			title="Referrals & Rewards"
			@open-side-nav="$emit('openSideNav')"
		/>

		<div class="referrals-page__content">
			<!-- Hero Banner -->
			<div class="hero-banner" :style="heroBannerStyle">
				<div class="hero-banner__background">
					<div class="hero-decoration hero-decoration--1"></div>
					<div class="hero-decoration hero-decoration--2"></div>
					<div class="hero-decoration hero-decoration--3"></div>
				</div>
				<div class="hero-banner__content">
					<div class="hero-banner__text">
						<h1 class="hero-title">{{ settings?.hero_banner?.title || 'Share the Gift of Health' }}</h1>
						<p class="hero-subtitle">{{ settings?.hero_banner?.subtitle || 'Invite friends to Rapid Capsule and earn rewards for every successful referral' }}</p>
					</div>
					<div v-if="settings?.hero_banner?.show_stats !== false" class="hero-stats">
						<div class="hero-stat">
							<span class="hero-stat__value">{{ stats?.total_signups || 0 }}</span>
							<span class="hero-stat__label">Friends Joined</span>
						</div>
						<div class="hero-stat">
							<span class="hero-stat__value">{{ stats?.total_credits_earned || 0 }}</span>
							<span class="hero-stat__label">Credits Earned</span>
						</div>
						<div class="hero-stat">
							<span class="hero-stat__value">{{ stats?.total_clicks || 0 }}</span>
							<span class="hero-stat__label">Link Clicks</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content Grid -->
			<div class="content-grid">
				<!-- Left Column -->
				<div class="content-column content-column--main">
					<!-- Referral Code Card -->
					<div class="referral-code-card">
						<div class="card-header">
							<div class="card-icon">
								<v-icon name="hi-link" scale="1.2" />
							</div>
							<div class="card-title-group">
								<h3 class="card-title">Your Referral Link</h3>
								<p class="card-subtitle">Share this link with friends and family</p>
							</div>
						</div>
						<div class="referral-link-box">
							<div class="referral-link">
								<span class="link-text">{{ referralLink }}</span>
								<button class="copy-btn" @click="copyLink" :class="{ copied: linkCopied }">
									<v-icon :name="linkCopied ? 'hi-check' : 'hi-clipboard-copy'" scale="0.9" />
									<span>{{ linkCopied ? 'Copied!' : 'Copy' }}</span>
								</button>
							</div>
							<div class="referral-code-display">
								<span class="code-label">Your Code:</span>
								<span class="code-value">{{ refCode }}</span>
							</div>
						</div>
					</div>

					<!-- Share Buttons -->
					<div class="share-card">
						<div class="card-header">
							<div class="card-icon share-icon">
								<v-icon name="hi-share" scale="1.2" />
							</div>
							<div class="card-title-group">
								<h3 class="card-title">Share with Friends</h3>
								<p class="card-subtitle">Choose how you'd like to spread the word</p>
							</div>
						</div>
						<div class="share-buttons">
							<button class="share-btn share-btn--whatsapp" @click="share('whatsapp')">
								<img src="@/assets/logos/social/whatsapp.svg" alt="WhatsApp" class="share-btn__icon" />
								<span class="share-btn__label">WhatsApp</span>
								<span v-if="stats?.shares_by_platform?.whatsapp" class="share-btn__count">{{ stats.shares_by_platform.whatsapp }}</span>
							</button>
							<button class="share-btn share-btn--twitter" @click="share('twitter')">
								<img src="@/assets/logos/social/twitter.svg" alt="Twitter" class="share-btn__icon" />
								<span class="share-btn__label">Twitter</span>
								<span v-if="stats?.shares_by_platform?.twitter" class="share-btn__count">{{ stats.shares_by_platform.twitter }}</span>
							</button>
							<button class="share-btn share-btn--facebook" @click="share('facebook')">
								<img src="@/assets/logos/social/facebook.svg" alt="Facebook" class="share-btn__icon" />
								<span class="share-btn__label">Facebook</span>
								<span v-if="stats?.shares_by_platform?.facebook" class="share-btn__count">{{ stats.shares_by_platform.facebook }}</span>
							</button>
							<button class="share-btn share-btn--linkedin" @click="share('linkedin')">
								<img src="@/assets/logos/social/linkedIn.svg" alt="LinkedIn" class="share-btn__icon" />
								<span class="share-btn__label">LinkedIn</span>
								<span v-if="stats?.shares_by_platform?.linkedin" class="share-btn__count">{{ stats.shares_by_platform.linkedin }}</span>
							</button>
							<button class="share-btn share-btn--email" @click="share('email')">
								<img src="@/assets/logos/social/email.svg" alt="Email" class="share-btn__icon" />
								<span class="share-btn__label">Email</span>
								<span v-if="stats?.shares_by_platform?.email" class="share-btn__count">{{ stats.shares_by_platform.email }}</span>
							</button>
							<button class="share-btn share-btn--sms" @click="share('sms')">
								<v-icon name="hi-chat-alt-2" scale="1.4" />
								<span class="share-btn__label">SMS</span>
								<span v-if="stats?.shares_by_platform?.sms" class="share-btn__count">{{ stats.shares_by_platform.sms }}</span>
							</button>
						</div>
					</div>

					<!-- Rewards Info -->
					<div class="rewards-info-card">
						<div class="rewards-info__header">
							<v-icon name="hi-gift" scale="1.5" class="rewards-info__icon" />
							<h3>How Rewards Work</h3>
						</div>
						<div class="rewards-steps">
							<div class="reward-step">
								<div class="step-number">1</div>
								<div class="step-content">
									<h4>Share Your Link</h4>
									<p>Send your unique referral link to friends and family</p>
								</div>
							</div>
							<div class="reward-step">
								<div class="step-number">2</div>
								<div class="step-content">
									<h4>They Sign Up</h4>
									<p>When they create an account using your link</p>
								</div>
							</div>
							<div class="reward-step">
								<div class="step-number">3</div>
								<div class="step-content">
									<h4>Both Get Rewarded</h4>
									<p>You both receive {{ settings?.referrer_credits || 1 }} free AI credit{{ (settings?.referrer_credits || 1) > 1 ? 's' : '' }}!</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column -->
				<div class="content-column content-column--sidebar">
					<!-- Stats Card -->
					<div class="stats-card">
						<h3 class="stats-card__title">Your Performance</h3>
						<div class="stats-grid">
							<div class="stat-item">
								<div class="stat-item__icon stat-item__icon--clicks">
									<v-icon name="hi-cursor-click" scale="1" />
								</div>
								<div class="stat-item__content">
									<span class="stat-item__value">{{ stats?.total_clicks || 0 }}</span>
									<span class="stat-item__label">Total Clicks</span>
								</div>
							</div>
							<div class="stat-item">
								<div class="stat-item__icon stat-item__icon--shares">
									<v-icon name="hi-share" scale="1" />
								</div>
								<div class="stat-item__content">
									<span class="stat-item__value">{{ stats?.total_shares || 0 }}</span>
									<span class="stat-item__label">Times Shared</span>
								</div>
							</div>
							<div class="stat-item">
								<div class="stat-item__icon stat-item__icon--signups">
									<v-icon name="hi-user-add" scale="1" />
								</div>
								<div class="stat-item__content">
									<span class="stat-item__value">{{ stats?.total_signups || 0 }}</span>
									<span class="stat-item__label">Friends Joined</span>
								</div>
							</div>
							<div class="stat-item">
								<div class="stat-item__icon stat-item__icon--rate">
									<v-icon name="hi-chart-bar" scale="1" />
								</div>
								<div class="stat-item__content">
									<span class="stat-item__value">{{ stats?.conversion_rate || 0 }}%</span>
									<span class="stat-item__label">Conversion Rate</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Milestones Card -->
					<div class="milestones-card" v-if="settings?.milestones?.length">
						<h3 class="milestones-card__title">Milestones</h3>
						<div class="milestones-list">
							<div
								v-for="milestone in settings.milestones"
								:key="milestone.referrals_required"
								class="milestone-item"
								:class="{ achieved: isMilestoneAchieved(milestone.referrals_required) }"
							>
								<div class="milestone-badge">
									<v-icon
										:name="getMilestoneIcon(milestone.badge_icon)"
										scale="1"
									/>
								</div>
								<div class="milestone-content">
									<span class="milestone-name">{{ milestone.badge_name }}</span>
									<span class="milestone-requirement">{{ milestone.referrals_required }} referrals</span>
								</div>
								<div class="milestone-reward">
									+{{ milestone.reward_value }} credits
								</div>
								<div class="milestone-status">
									<v-icon
										:name="isMilestoneAchieved(milestone.referrals_required) ? 'hi-check-circle' : 'hi-lock-closed'"
										scale="0.9"
									/>
								</div>
							</div>
						</div>
						<div v-if="stats?.next_milestone" class="next-milestone-progress">
							<div class="progress-text">
								<span>{{ stats.total_signups }} / {{ stats.next_milestone.referrals_required }} to next milestone</span>
							</div>
							<div class="progress-bar">
								<div
									class="progress-bar__fill"
									:style="{ width: `${(stats.total_signups / stats.next_milestone.referrals_required) * 100}%` }"
								></div>
							</div>
						</div>
					</div>

					<!-- Recent Referrals -->
					<div class="recent-referrals-card" v-if="stats?.referrals?.length">
						<h3 class="recent-referrals__title">Recent Referrals</h3>
						<div class="referrals-list">
							<div
								v-for="referral in stats.referrals.slice(0, 5)"
								:key="referral.referee?._id"
								class="referral-item"
							>
								<div class="referral-avatar">
									<img
										v-if="referral.referee?.profile?.profile_image"
										:src="referral.referee.profile.profile_image"
										:alt="getRefereeName(referral)"
									/>
									<div v-else class="avatar-placeholder">
										{{ getInitials(referral) }}
									</div>
								</div>
								<div class="referral-info">
									<span class="referral-name">{{ getRefereeName(referral) }}</span>
									<span class="referral-date">{{ formatDate(referral.date_referred) }}</span>
								</div>
								<div class="referral-status" :class="referral.status">
									<span>{{ referral.status }}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Empty State for Referrals -->
					<div class="empty-referrals-card" v-else>
						<div class="empty-icon">
							<v-icon name="hi-users" scale="2.5" />
						</div>
						<h4>No referrals yet</h4>
						<p>Start sharing your link to see your referrals here!</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<Transition name="toast" mode="in-out">
		<Toasts v-if="showToast" :message="message" />
	</Transition>
</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex";
import TopBar from "@/components/Navigation/top-bar.vue";
import Toasts from "@/components/alerts/toasts.vue";

export default {
	name: "View: Referals & Rewards",

	emits: ["openSideNav"],

	components: {
		TopBar,
		Toasts,
	},

	data() {
		return {
			message: "",
			showToast: false,
			linkCopied: false,
			stats: null,
			settings: null,
			shareMessages: null,
			loading: true,
		};
	},

	computed: {
		...mapGetters({
			referrals: "referral",
			user: "user",
		}),

		refCode() {
			return this.referrals?.referral_code || "";
		},

		referralLink() {
			return `https://rapidcapsule.com/r/${this.refCode}`;
		},

		heroBannerStyle() {
			if (this.settings?.hero_banner) {
				return {
					'--hero-bg': this.settings.hero_banner.background_color || '#0EAEC4',
					'--hero-text': this.settings.hero_banner.text_color || '#ffffff',
				};
			}
			return {};
		},
	},

	async mounted() {
		await this.fetchData();
	},

	methods: {
		async fetchData() {
			this.loading = true;
			try {
				const [statsRes, messagesRes, settingsRes] = await Promise.all([
					axios.get("referrals/stats"),
					axios.get("referrals/share-messages"),
					axios.get("referrals/settings"),
				]);

				this.stats = statsRes.data.data;
				this.shareMessages = messagesRes.data.data;
				this.settings = settingsRes.data.data;
			} catch (error) {
				console.error("Error fetching referral data:", error);
			} finally {
				this.loading = false;
			}
		},

		async share(platform) {
			const link = this.shareMessages?.referral_link || this.referralLink;
			const messages = this.shareMessages?.messages || {};

			// Track the share
			try {
				await axios.post("referrals/track-share", { platform });
				// Update local stats
				if (this.stats?.shares_by_platform) {
					this.stats.shares_by_platform[platform] = (this.stats.shares_by_platform[platform] || 0) + 1;
					this.stats.total_shares = (this.stats.total_shares || 0) + 1;
				}
			} catch (error) {
				console.error("Error tracking share:", error);
			}

			const linkWithSource = `${link}?src=${platform.substring(0, 2)}`;

			switch (platform) {
				case "whatsapp": {
					const waMessage = messages.whatsapp || `Check out Rapid Capsule! ${linkWithSource}`;
					window.open(`https://api.whatsapp.com/send/?text=${encodeURIComponent(waMessage.replace(link, linkWithSource))}`);
					break;
				}

				case "twitter": {
					const twMessage = messages.twitter || `Check out Rapid Capsule! ${linkWithSource}`;
					window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twMessage.replace(link, linkWithSource))}`);
					break;
				}

				case "facebook": {
					window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkWithSource)}&quote=${encodeURIComponent(messages.facebook || '')}`);
					break;
				}

				case "linkedin": {
					const liMessage = messages.linkedin || `Check out Rapid Capsule!`;
					window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkWithSource)}`);
					break;
				}

				case "email": {
					const subject = encodeURIComponent(messages.email_subject || "Check out Rapid Capsule!");
					const body = encodeURIComponent((messages.email_body || `Check out this amazing health platform: ${link}`).replace(link, linkWithSource));
					window.open(`mailto:?subject=${subject}&body=${body}`);
					break;
				}

				case "sms": {
					const smsMessage = messages.sms || `Check out Rapid Capsule! ${linkWithSource}`;
					window.open(`sms:?body=${encodeURIComponent(smsMessage.replace(link, linkWithSource))}`);
					break;
				}
			}
		},

		async copyLink() {
			const link = `${this.referralLink}?src=copy`;
			try {
				await navigator.clipboard.writeText(link);
				this.linkCopied = true;
				this.message = "Referral link copied to clipboard!";
				this.showToast = true;

				// Track the copy as a share
				try {
					await axios.post("referrals/track-share", { platform: "copy" });
					if (this.stats?.shares_by_platform) {
						this.stats.shares_by_platform.copy = (this.stats.shares_by_platform.copy || 0) + 1;
						this.stats.total_shares = (this.stats.total_shares || 0) + 1;
					}
				} catch (error) {
					console.error("Error tracking copy:", error);
				}

				setTimeout(() => {
					this.showToast = false;
					this.linkCopied = false;
				}, 3000);
			} catch (error) {
				this.message = "Failed to copy link";
				this.showToast = true;
				setTimeout(() => {
					this.showToast = false;
				}, 3000);
			}
		},

		isMilestoneAchieved(referralsRequired) {
			return this.stats?.milestones_achieved?.includes(referralsRequired) ||
				(this.stats?.total_signups >= referralsRequired);
		},

		getMilestoneIcon(icon) {
			const iconMap = {
				star: "hi-star",
				trophy: "gi-trophy",
				crown: "gi-crown",
				shield: "hi-shield-check",
			};
			return iconMap[icon] || "hi-star";
		},

		getRefereeName(referral) {
			if (!referral.referee?.profile) return "Anonymous";
			const { first_name, last_name } = referral.referee.profile;
			return `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous";
		},

		getInitials(referral) {
			if (!referral.referee?.profile) return "?";
			const { first_name, last_name } = referral.referee.profile;
			return `${(first_name || "")[0] || ""}${(last_name || "")[0] || ""}`.toUpperCase() || "?";
		},

		formatDate(dateString) {
			if (!dateString) return "";
			const date = new Date(dateString);
			const now = new Date();
			const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

			if (diffDays === 0) return "Today";
			if (diffDays === 1) return "Yesterday";
			if (diffDays < 7) return `${diffDays} days ago`;

			return date.toLocaleDateString("en-NG", {
				month: "short",
				day: "numeric",
				year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
			});
		},
	},
};
</script>

<style scoped lang="scss">
.referrals-page {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: #f8fafc;
	overflow-x: hidden;
	width: 100%;
	max-width: 100vw;

	&__content {
		flex: 1;
		padding: 0;
		overflow-x: hidden;
		overflow-y: auto;
		width: 100%;
		@include scrollBar(normal);
	}
}

// Hero Banner
.hero-banner {
	position: relative;
	background: linear-gradient(135deg, var(--hero-bg, #0EAEC4) 0%, #0891b2 50%, #0e7490 100%);
	color: var(--hero-text, #ffffff);
	padding: $size-48 $size-48 $size-36;
	margin: $size-24 $size-48 0;
	border-radius: $size-24;
	overflow: hidden;
	box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);
	box-sizing: border-box;

	@media (max-width: 768px) {
		padding: $size-28 $size-20 $size-24;
		margin: $size-16;
		margin-bottom: 0;
		border-radius: $size-16;
	}

	@media (max-width: 480px) {
		padding: $size-20 $size-16;
		margin: $size-12;
		margin-bottom: 0;
		border-radius: $size-12;
	}

	&__background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.hero-decoration {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);

		&--1 {
			width: 300px;
			height: 300px;
			top: -100px;
			right: -50px;

			@media (max-width: 480px) {
				width: 150px;
				height: 150px;
				top: -50px;
				right: -30px;
			}
		}

		&--2 {
			width: 200px;
			height: 200px;
			bottom: -80px;
			left: 10%;

			@media (max-width: 480px) {
				width: 100px;
				height: 100px;
				bottom: -40px;
			}
		}

		&--3 {
			width: 150px;
			height: 150px;
			top: 50%;
			right: 20%;

			@media (max-width: 480px) {
				display: none;
			}
		}
	}

	&__content {
		position: relative;
		z-index: 1;
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $size-32;

		@media (max-width: 768px) {
			flex-direction: column;
			text-align: center;
			gap: $size-20;
		}
	}

	&__text {
		flex: 1;
	}

	.hero-title {
		font-size: $size-36;
		font-weight: $fw-bold;
		margin: 0 0 $size-12;
		line-height: 1.2;

		@media (max-width: 768px) {
			font-size: $size-24;
		}

		@media (max-width: 480px) {
			font-size: $size-20;
			margin-bottom: $size-8;
		}
	}

	.hero-subtitle {
		font-size: $size-18;
		opacity: 0.9;
		margin: 0;
		max-width: 500px;

		@media (max-width: 768px) {
			font-size: $size-14;
			max-width: none;
		}

		@media (max-width: 480px) {
			font-size: $size-13;
		}
	}

	.hero-stats {
		display: flex;
		gap: $size-24;
		flex-wrap: wrap;
		justify-content: center;

		@media (max-width: 768px) {
			gap: $size-12;
			width: 100%;
		}

		@media (max-width: 480px) {
			gap: $size-8;
		}
	}

	.hero-stat {
		text-align: center;
		padding: $size-16 $size-24;
		background: rgba(255, 255, 255, 0.15);
		border-radius: $size-12;
		backdrop-filter: blur(10px);
		min-width: 100px;

		@media (max-width: 768px) {
			padding: $size-12 $size-16;
			flex: 1;
			min-width: 80px;
		}

		@media (max-width: 480px) {
			padding: $size-10 $size-12;
			min-width: 70px;
		}

		&__value {
			display: block;
			font-size: $size-32;
			font-weight: $fw-bold;

			@media (max-width: 768px) {
				font-size: $size-20;
			}

			@media (max-width: 480px) {
				font-size: $size-18;
			}
		}

		&__label {
			display: block;
			font-size: $size-13;
			opacity: 0.9;
			margin-top: $size-4;

			@media (max-width: 768px) {
				font-size: $size-11;
			}

			@media (max-width: 480px) {
				font-size: $size-10;
			}
		}
	}
}

// Content Grid
.content-grid {
	display: grid;
	grid-template-columns: 1fr 380px;
	gap: $size-24;
	max-width: 1200px;
	margin: 0 auto;
	padding: $size-24 $size-48;
	box-sizing: border-box;
	width: 100%;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		padding: $size-20 $size-16;
	}

	@media (max-width: 480px) {
		padding: $size-16 $size-12;
		gap: $size-16;
	}
}

.content-column {
	display: flex;
	flex-direction: column;
	gap: $size-20;

	@media (max-width: 480px) {
		gap: $size-16;
	}
}

// Card Base Styles
.referral-code-card,
.share-card,
.rewards-info-card,
.stats-card,
.milestones-card,
.recent-referrals-card,
.empty-referrals-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	border: 1px solid #e5e7eb;
	box-sizing: border-box;
	width: 100%;
	max-width: 100%;
	overflow: hidden;

	@media (max-width: 768px) {
		padding: $size-20;
		border-radius: $size-12;
	}

	@media (max-width: 480px) {
		padding: $size-16;
		border-radius: $size-10;
	}
}

.card-header {
	display: flex;
	align-items: flex-start;
	gap: $size-16;
	margin-bottom: $size-20;

	@media (max-width: 480px) {
		gap: $size-12;
		margin-bottom: $size-16;
	}
}

.card-icon {
	width: 48px;
	height: 48px;
	border-radius: $size-12;
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	@media (max-width: 480px) {
		width: 40px;
		height: 40px;
		border-radius: $size-10;
	}

	&.share-icon {
		background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 10%) 100%);
	}
}

.card-title-group {
	flex: 1;
	min-width: 0;
}

.card-title {
	font-size: $size-18;
	font-weight: $fw-semi-bold;
	color: #111827;
	margin: 0 0 $size-4;

	@media (max-width: 480px) {
		font-size: $size-16;
	}
}

.card-subtitle {
	font-size: $size-14;
	color: #6b7280;
	margin: 0;

	@media (max-width: 480px) {
		font-size: $size-12;
	}
}

// Referral Link Box
.referral-link-box {
	background: #f9fafb;
	border-radius: $size-12;
	padding: $size-16;
	box-sizing: border-box;
	width: 100%;
	overflow: hidden;

	@media (max-width: 480px) {
		padding: $size-12;
		border-radius: $size-10;
	}
}

.referral-link {
	display: flex;
	align-items: center;
	gap: $size-12;
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: $size-10;
	padding: $size-12 $size-16;
	margin-bottom: $size-12;
	box-sizing: border-box;
	width: 100%;
	overflow: hidden;

	@media (max-width: 480px) {
		flex-direction: column;
		gap: $size-10;
		padding: $size-12;
	}

	.link-text {
		flex: 1;
		font-size: $size-14;
		color: #374151;
		font-family: monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
		max-width: 100%;

		@media (max-width: 480px) {
			width: 100%;
			font-size: $size-11;
			text-align: center;
		}
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: $size-6;
		padding: $size-8 $size-16;
		background: #0EAEC4;
		color: white;
		border: none;
		border-radius: $size-8;
		font-size: $size-14;
		font-weight: $fw-medium;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;

		@media (max-width: 480px) {
			width: 100%;
			justify-content: center;
			padding: $size-10 $size-16;
		}

		&:hover {
			background: #0891b2;
		}

		&.copied {
			background: #10b981;
		}
	}
}

.referral-code-display {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-8;

	.code-label {
		font-size: $size-14;
		color: #6b7280;

		@media (max-width: 480px) {
			font-size: $size-12;
		}
	}

	.code-value {
		font-size: $size-18;
		font-weight: $fw-bold;
		color: #0EAEC4;
		font-family: monospace;
		letter-spacing: 1px;

		@media (max-width: 480px) {
			font-size: $size-16;
		}
	}
}

// Share Buttons
.share-buttons {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $size-12;

	@media (max-width: 600px) {
		grid-template-columns: repeat(3, 1fr);
		gap: $size-8;
	}

	@media (max-width: 400px) {
		grid-template-columns: repeat(2, 1fr);
	}
}

.share-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-8;
	padding: $size-16;
	background: #f9fafb;
	border: 2px solid transparent;
	border-radius: $size-12;
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;

	@media (max-width: 480px) {
		padding: $size-12;
		gap: $size-6;
		border-radius: $size-10;
	}

	&__icon {
		width: 40px;
		height: 40px;
		object-fit: contain;

		@media (max-width: 480px) {
			width: 32px;
			height: 32px;
		}
	}

	&__label {
		font-size: $size-13;
		font-weight: $fw-medium;
		color: #374151;

		@media (max-width: 480px) {
			font-size: $size-11;
		}
	}

	&__count {
		position: absolute;
		top: $size-8;
		right: $size-8;
		font-size: $size-11;
		background: #0EAEC4;
		color: white;
		padding: 2px 6px;
		border-radius: 10px;
		font-weight: $fw-medium;

		@media (max-width: 480px) {
			top: $size-4;
			right: $size-4;
			font-size: $size-10;
			padding: 1px 5px;
		}
	}

	&:hover {
		background: white;
		border-color: #0EAEC4;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(14, 174, 196, 0.15);
	}

	&--whatsapp:hover { border-color: #25d366; }
	&--twitter:hover { border-color: #1da1f2; }
	&--facebook:hover { border-color: #1877f2; }
	&--linkedin:hover { border-color: #0077b5; }
	&--email:hover { border-color: #6b7280; }
	&--sms:hover { border-color: #0EAEC4; }

	&--sms {
		color: #0EAEC4;
	}
}

// Rewards Info
.rewards-info-card {
	.rewards-info__header {
		display: flex;
		align-items: center;
		gap: $size-12;
		margin-bottom: $size-20;

		.rewards-info__icon {
			color: #f59e0b;
		}

		h3 {
			font-size: $size-18;
			font-weight: $fw-semi-bold;
			color: #111827;
			margin: 0;
		}
	}

	.rewards-steps {
		display: flex;
		flex-direction: column;
		gap: $size-16;
	}

	.reward-step {
		display: flex;
		align-items: flex-start;
		gap: $size-16;

		.step-number {
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: $fw-bold;
			font-size: $size-14;
			flex-shrink: 0;
		}

		.step-content {
			h4 {
				font-size: $size-15;
				font-weight: $fw-semi-bold;
				color: #111827;
				margin: 0 0 $size-4;
			}

			p {
				font-size: $size-14;
				color: #6b7280;
				margin: 0;
			}
		}
	}
}

// Stats Card
.stats-card {
	&__title {
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: #111827;
		margin: 0 0 $size-16;

		@media (max-width: 480px) {
			font-size: $size-15;
			margin-bottom: $size-12;
		}
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $size-12;

		@media (max-width: 480px) {
			gap: $size-8;
		}
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: $size-12;
		padding: $size-12;
		background: #f9fafb;
		border-radius: $size-10;

		@media (max-width: 480px) {
			gap: $size-10;
			padding: $size-10;
		}

		&__icon {
			width: 40px;
			height: 40px;
			border-radius: $size-10;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;

			@media (max-width: 480px) {
				width: 36px;
				height: 36px;
			}

			&--clicks {
				background: rgba(99, 102, 241, 0.1);
				color: #6366f1;
			}

			&--shares {
				background: rgba(16, 185, 129, 0.1);
				color: #10b981;
			}

			&--signups {
				background: rgba(245, 158, 11, 0.1);
				color: #f59e0b;
			}

			&--rate {
				background: rgba(239, 68, 68, 0.1);
				color: #ef4444;
			}
		}

		&__content {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__value {
			font-size: $size-20;
			font-weight: $fw-bold;
			color: #111827;

			@media (max-width: 480px) {
				font-size: $size-16;
			}
		}

		&__label {
			font-size: $size-12;
			color: #6b7280;

			@media (max-width: 480px) {
				font-size: $size-11;
			}
		}
	}
}

// Milestones Card
.milestones-card {
	&__title {
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: #111827;
		margin: 0 0 $size-16;

		@media (max-width: 480px) {
			font-size: $size-15;
			margin-bottom: $size-12;
		}
	}

	.milestones-list {
		display: flex;
		flex-direction: column;
		gap: $size-10;

		@media (max-width: 480px) {
			gap: $size-8;
		}
	}

	.milestone-item {
		display: flex;
		align-items: center;
		gap: $size-12;
		padding: $size-12;
		background: #f9fafb;
		border-radius: $size-10;
		transition: all 0.2s ease;

		@media (max-width: 480px) {
			gap: $size-10;
			padding: $size-10;
		}

		&.achieved {
			background: rgba(16, 185, 129, 0.1);

			.milestone-badge {
				background: #10b981;
			}

			.milestone-status {
				color: #10b981;
			}
		}

		.milestone-badge {
			width: 36px;
			height: 36px;
			border-radius: $size-8;
			background: #d1d5db;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;

			@media (max-width: 480px) {
				width: 32px;
				height: 32px;
			}
		}

		.milestone-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;

			.milestone-name {
				font-size: $size-14;
				font-weight: $fw-medium;
				color: #111827;

				@media (max-width: 480px) {
					font-size: $size-13;
				}
			}

			.milestone-requirement {
				font-size: $size-12;
				color: #6b7280;

				@media (max-width: 480px) {
					font-size: $size-11;
				}
			}
		}

		.milestone-reward {
			font-size: $size-13;
			font-weight: $fw-semi-bold;
			color: #0EAEC4;
			white-space: nowrap;

			@media (max-width: 480px) {
				font-size: $size-11;
			}
		}

		.milestone-status {
			color: #9ca3af;
			flex-shrink: 0;
		}
	}

	.next-milestone-progress {
		margin-top: $size-16;
		padding-top: $size-16;
		border-top: 1px solid #e5e7eb;

		@media (max-width: 480px) {
			margin-top: $size-12;
			padding-top: $size-12;
		}

		.progress-text {
			font-size: $size-13;
			color: #6b7280;
			margin-bottom: $size-8;

			@media (max-width: 480px) {
				font-size: $size-12;
			}
		}

		.progress-bar {
			height: 8px;
			background: #e5e7eb;
			border-radius: 4px;
			overflow: hidden;

			&__fill {
				height: 100%;
				background: linear-gradient(90deg, #0EAEC4 0%, #0891b2 100%);
				border-radius: 4px;
				transition: width 0.3s ease;
			}
		}
	}
}

// Recent Referrals
.recent-referrals-card {
	.recent-referrals__title {
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: #111827;
		margin: 0 0 $size-16;

		@media (max-width: 480px) {
			font-size: $size-15;
			margin-bottom: $size-12;
		}
	}

	.referrals-list {
		display: flex;
		flex-direction: column;
		gap: $size-10;

		@media (max-width: 480px) {
			gap: $size-8;
		}
	}

	.referral-item {
		display: flex;
		align-items: center;
		gap: $size-12;
		padding: $size-12;
		background: #f9fafb;
		border-radius: $size-10;

		@media (max-width: 480px) {
			gap: $size-10;
			padding: $size-10;
		}

		.referral-avatar {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			overflow: hidden;
			flex-shrink: 0;

			@media (max-width: 480px) {
				width: 36px;
				height: 36px;
			}

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.avatar-placeholder {
				width: 100%;
				height: 100%;
				background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
				color: white;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: $size-14;
				font-weight: $fw-semi-bold;

				@media (max-width: 480px) {
					font-size: $size-12;
				}
			}
		}

		.referral-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;

			.referral-name {
				font-size: $size-14;
				font-weight: $fw-medium;
				color: #111827;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;

				@media (max-width: 480px) {
					font-size: $size-13;
				}
			}

			.referral-date {
				font-size: $size-12;
				color: #6b7280;

				@media (max-width: 480px) {
					font-size: $size-11;
				}
			}
		}

		.referral-status {
			font-size: $size-11;
			font-weight: $fw-medium;
			padding: $size-4 $size-8;
			border-radius: $size-6;
			text-transform: capitalize;
			flex-shrink: 0;

			@media (max-width: 480px) {
				font-size: $size-10;
				padding: $size-4 $size-6;
			}

			&.pending {
				background: rgba(245, 158, 11, 0.1);
				color: #f59e0b;
			}

			&.completed, &.rewarded {
				background: rgba(16, 185, 129, 0.1);
				color: #10b981;
			}
		}
	}
}

// Empty State
.empty-referrals-card {
	text-align: center;
	padding: $size-32 $size-24;

	@media (max-width: 480px) {
		padding: $size-24 $size-16;
	}

	.empty-icon {
		color: #d1d5db;
		margin-bottom: $size-16;
	}

	h4 {
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: #374151;
		margin: 0 0 $size-8;

		@media (max-width: 480px) {
			font-size: $size-15;
		}
	}

	p {
		font-size: $size-14;
		color: #6b7280;
		margin: 0;

		@media (max-width: 480px) {
			font-size: $size-13;
		}
	}
}

// Toast Animation
@include animation(toast-transition);
</style>
