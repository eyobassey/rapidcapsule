<template>
	<div class="nav-container">
		<div class="nav-logo">
			<div class="logo"><Logos name="logo-full-color" /></div>
			<Icons name="chevron-left" id="close" @click="$emit('closeSideNav')" />
		</div>
		<div class="nav">
			<div class="nav__primary">
				<div
					class="nav__item nav__item--container"
					v-for="item of primaryNav"
					:key="item.label"
				>
					<div
						class="nav__item nav__item--parent"
						v-if="item.link == ''"
						@click="expandLink(item)"
						:class="{ active__parent: item.children.some((el) => el.link == getRoute) }"
					>
						<div class="nav__item--icon-main"><Icons :name="item.icon" /></div>
						<p>{{ item.label }}</p>

						<div class="nav__item--icon-expand" v-if="item.children.length">
							<Icons name="arrow-up" v-if="item.isExpanded" />
							<Icons name="arrow-down" v-if="!item.isExpanded" />
						</div>
					</div>
					<router-link
						v-else
						class="nav__item nav__item--parent"
						:class="{ active__parent: getRoute == item.link }"
						:to="item.children.length ? isSelected : item.link"
						@click="$emit('closeSideNav')"
					>
						<div class="nav__item--icon-main"><Icons :name="item.icon" /></div>
						<p>{{ item.label }}</p>
					</router-link>

					<div
						class="nav__item nav__item--child-container"
						v-if="item.children.length"
						:class="{ open: item.isExpanded }"
					>
						<div v-for="child of item.children" :key="child.label">
							<router-link
								:class="{ active__child: getRoute == child.link }"
								:to="child.link"
								class="nav__item nav__item--child"
								@click="$emit('closeSideNav')"
							>
								{{ child.label }}
							</router-link>
						</div>
					</div>
				</div>
			</div>
			<div class="nav__secondary">
				<router-link
					class="nav__item nav__item--parent"
					:class="{ active__parent: getRoute == item.link }"
					v-for="item of secondaryNav"
					:key="item.label"
					:to="item.link"
					@click="$emit('closeSideNav')"
				>
					<div class="nav__item--icon-main">
						<Icons :name="item.icon" />
					</div>
					<p>{{ item.label }}</p>
				</router-link>
			</div>
		</div>
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";
import Logos from "@/components/logos.vue";

export default {
	data() {
		return {
			primaryNav: [
				{ link: "/app/specialist/specialist-dashboard", label: "Dashboard", children: [], icon: "home" },
				{
					link: "/app/specialist/specialist-appointments",
					label: "Appointments",
					children: [],
					icon: "cross",
				},
				{
					link: "",
					label: "Patients",
					children: [
						{ link: "/app/specialist/patients", label: "My Patients" },
						{ link: "/app/specialist/patients/all", label: "All Patients" },
						{ link: "/app/specialist/patients/starred", label: "Starred" }
					],
					icon: "users",
					isExpanded: false
				},
				{
					link: "",
					label: "Clinical Notes",
					children: [
						{ link: "/app/specialist/clinical-notes", label: "All Notes" },
						{ link: "/app/specialist/clinical-notes/templates", label: "Templates" }
					],
					icon: "list",
					isExpanded: false
				},
				{
					link: "",
					label: "Pharmacy",
					children: [
						{ link: "/app/specialist/pharmacy", label: "Dashboard" },
						{ link: "/app/specialist/pharmacy/patients", label: "Patients" },
						{ link: "/app/specialist/pharmacy/drugs", label: "Drug Catalog" },
						{ link: "/app/specialist/pharmacy/prescriptions", label: "Prescriptions" }
					],
					icon: "pill",
					isExpanded: false
				},
			],
			secondaryNav: [
				// {
				// 	link: "/app/specialist/referals-and-rewards",
				// 	label: "Referals & Rewards",
				// 	icon: "gift-box",
				// },
				{ link: "/app/specialist/specialist-account", label: "Account", icon: "user" },
				// { link: "/app/specialist/app-settings", label: "App Settings", icon: "cog-wheel" },
			],
		};
	},
	computed: {
		getRoute() {
			return this.$route.path;
		},
	},

	emits: ["closeSideNav"],

	methods: {
		expandLink(item) {
			if (item.children.length) {
				item.isExpanded = !item.isExpanded;
			} else {
				item.isExpanded = item.isExpanded;
			}
		},
	},

	components: {
		Icons,
		Logos,
	},
};
</script>

<style scoped lang="scss">
.nav-container {
	@include flexItem(vertical) {
		flex-shrink: 0;
		padding: $size-32 $size-0;
		border-right: $size-1 solid $color-g-85;
		background-color: $color-white;
		height: 100%;

		@include responsive(tab-landscape) {
			position: absolute;
			top: $size-0;
			left: -100%;
			transition: all 400ms ease-out;
			z-index: 100;
			padding-top: $size-18;

			&.open {
				left: 0;
				box-shadow: $size-4 $size-0 $size-44 rgba($color-black, 0.25);
			}
		}
	}
}

#close {
	display: none;
	fill: $color-g-77;

	@include responsive(tab-landscape) {
		display: block;
	}
}

.nav-logo {
	@include flexItem(horizontal) {
		align-items: center;
		gap: $size-16;
		height: 6.133rem;
		padding-left: 2.8rem;
		padding-right: $size-24;
	}

	.logo {
		flex-grow: 1;
	}
}

.nav {
	@include flexItem(vertical) {
		height: 100%;
		gap: $size-32;
	}

	&__primary {
		height: 100%;
	}

	&__secondary {
		padding-top: $size-32;
		border-top: 1px solid $color-g-90;
	}
}
.nav__item {
	display: flex;

	&--container {
		flex-direction: column;
	}

	&--parent {
		position: relative;
		align-items: center;
		gap: $size-8;
		padding: $size-8 $size-16 $size-8 $size-32;
		cursor: pointer;
		text-decoration: none;

		& p {
			font-size: $size-16;
			font-weight: $fw-regular;
			line-height: 1.5;
			letter-spacing: 0.02em;
		}

		&:hover {
			background-color: $color-g-92;
		}
	}

	&--child-container {
		display: none;
	}

	&--child {
		gap: $size-8;
		padding: $size-18 $size-16 $size-18 $size-72;
		cursor: pointer;
		background-color: $color-g-97;
		text-decoration: none;

		&:hover {
			background-color: $color-g-90;
		}
	}

	&--icon-main,
	&--icon-expand {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: center;
			padding: $size-8;
		}
	}

	&--icon-main > .icons {
		width: $size-32;
		height: $size-32;
		fill: $color-g-44;
	}
}

.open {
	@include flexItem(vertical);
}

.active__parent {
	&:before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		background-color: $color-pri;
	}
}

.active__child {
	background-color: $color-g-90;
}
</style>
