<template>
	<div @click="$emit('action')">
		<Icons :name="iconName" :iconId="iconName" :style="{ fill: color }" />
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";

export default {
	name: "List Action Button",

	components: {
		Icons,
	},

	props: {
		iconName: {
			type: String,
			required: true,
		},
		color: {
			type: String,
			default: "hsl(0, 0, 21)",
		},
	},
};
</script>
