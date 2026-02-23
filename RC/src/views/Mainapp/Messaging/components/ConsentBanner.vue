<template>
	<div class="consent-container">
		<div class="consent-card">
			<div class="consent-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" stroke-width="1.5">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
			</div>
			<h2>Messaging Consent</h2>
			<p class="consent-text">
				Before using the messaging feature, please acknowledge the following:
			</p>
			<ul class="consent-points">
				<li>All messages are stored securely and encrypted in transit and at rest</li>
				<li>Messages may be reviewed by authorized administrators for compliance and quality assurance purposes</li>
				<li>Message records are retained for a minimum of 6 years in accordance with healthcare regulations</li>
				<li>Do NOT use messaging for medical emergencies -- call your local emergency services immediately</li>
			</ul>
			<div class="consent-actions">
				<button class="btn-consent" @click="$emit('consent-given')">
					I Understand and Agree
				</button>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	emits: ["consent-given"],
};
</script>

<style scoped lang="scss">
.consent-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 24px;
}

.consent-card {
	background: white;
	border-radius: 16px;
	padding: 40px;
	max-width: 520px;
	text-align: center;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.consent-icon {
	margin-bottom: 16px;
}

h2 {
	font-size: 22px;
	font-weight: 700;
	color: #1e293b;
	margin: 0 0 12px;
}

.consent-text {
	font-size: 14px;
	color: #64748b;
	margin: 0 0 20px;
}

.consent-points {
	text-align: left;
	padding: 0;
	margin: 0 0 28px;
	list-style: none;
}

.consent-points li {
	font-size: 13px;
	color: #475569;
	padding: 8px 0 8px 24px;
	position: relative;
	line-height: 1.5;
}

.consent-points li::before {
	content: "";
	position: absolute;
	left: 0;
	top: 14px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #4FC3F7;
}

.btn-consent {
	padding: 12px 32px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	font-size: 15px;
	font-weight: 600;
	cursor: pointer;
	transition: transform 0.15s, box-shadow 0.15s;
}

.btn-consent:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 16px rgba(79, 195, 247, 0.4);
}
</style>
