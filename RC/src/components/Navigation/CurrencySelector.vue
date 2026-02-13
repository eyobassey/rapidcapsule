<template>
	<div class="currency-selector" ref="selectorRef">
		<button class="currency-selector__trigger" @click="open = !open" :aria-expanded="open">
			<span class="currency-selector__flag">{{ currentConfig.flag }}</span>
			<span class="currency-selector__code">{{ currentConfig.code }}</span>
			<svg class="currency-selector__chevron" :class="{ rotated: open }" width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<transition name="dropdown">
			<div v-if="open" class="currency-selector__dropdown">
				<button
					v-for="cur in currencies"
					:key="cur.code"
					class="currency-selector__option"
					:class="{ active: cur.code === currentConfig.code }"
					@click="selectCurrency(cur.code)"
				>
					<span class="currency-selector__flag">{{ cur.flag }}</span>
					<span class="currency-selector__option-code">{{ cur.code }}</span>
					<span class="currency-selector__option-symbol">{{ cur.symbol }}</span>
				</button>
			</div>
		</transition>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { SUPPORTED_CURRENCIES } from '@/utilities/currency';

const store = useStore();
const open = ref(false);
const selectorRef = ref(null);

const currencies = Object.values(SUPPORTED_CURRENCIES);
const currentConfig = computed(() => {
	const code = store.getters['currency/currencyCode'];
	return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
});

function selectCurrency(code) {
	store.dispatch('currency/setCurrency', code);
	open.value = false;
}

function onClickOutside(e) {
	if (selectorRef.value && !selectorRef.value.contains(e.target)) {
		open.value = false;
	}
}

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>

<style scoped lang="scss">
.currency-selector {
	position: relative;
	z-index: 100;
}

.currency-selector__trigger {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border: 1px solid #e2e8f0;
	border-radius: 50px;
	background: #fff;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	color: #334155;
	transition: all 0.2s ease;
	white-space: nowrap;

	&:hover {
		border-color: #cbd5e1;
		background: #f8fafc;
	}
}

.currency-selector__flag {
	font-size: 16px;
	line-height: 1;
}

.currency-selector__code {
	font-size: 13px;
	font-weight: 600;
	letter-spacing: 0.5px;
}

.currency-selector__chevron {
	transition: transform 0.2s ease;
	color: #94a3b8;

	&.rotated {
		transform: rotate(180deg);
	}
}

.currency-selector__dropdown {
	position: absolute;
	top: calc(100% + 6px);
	right: 0;
	background: #fff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	padding: 4px;
	min-width: 140px;
	z-index: 101;
}

.currency-selector__option {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 8px 12px;
	border: none;
	background: none;
	cursor: pointer;
	border-radius: 8px;
	font-size: 14px;
	color: #334155;
	transition: background 0.15s ease;

	&:hover {
		background: #f1f5f9;
	}

	&.active {
		background: #eff6ff;
		color: #0288d1;
		font-weight: 600;
	}
}

.currency-selector__option-code {
	font-weight: 600;
	flex: 1;
}

.currency-selector__option-symbol {
	color: #94a3b8;
	font-size: 13px;
}

// Dropdown transition
.dropdown-enter-active {
	transition: all 0.15s ease-out;
}
.dropdown-leave-active {
	transition: all 0.1s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
</style>
