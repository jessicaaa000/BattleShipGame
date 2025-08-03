<template>
	<div class="ship-placement-panel">
		<h3>Available Ships</h3>
		<div class="ship-options-container">
			<div
				v-for="(ship, index) in remainingShips"
				:key="'ship-' + index"
				class="ship-choice"
				:class="{
					selected: chosenShipIndex === index,
					disabled: ship.quantity === 0,
				}"
				@mouseover="$emit('highlight-ship', index)"
				@mouseleave="$emit('remove-highlight')"
				@click="$emit('choose-ship', index)"
				@contextmenu.prevent="$emit('toggle-orientation')"
			>
				<div
					class="ship-visual"
					:class="{ 'vertical-layout': !isShipHorizontal }"
				>
					<div
						v-for="i in ship.size"
						:key="i"
						class="ship-part"
						:style="{
							backgroundColor:
								chosenShipIndex === index
									? 'blue'
									: highlightedShipIndex === index
									? highlightColor
									: '#666',
						}"
					></div>
				</div>
				<div class="ship-details">
					<span
						>{{ ship.size }} mast{{
							ship.size > 1 ? 's' : ''
						}}</span
					>
					<span>{{ ship.quantity }} remaining</span>
				</div>
			</div>
		</div>
		<div class="orientation-display">
			Current orientation:
			{{ isShipHorizontal ? 'Horizontal' : 'Vertical' }} (Right-click to
			rotate)
		</div>
		<div class="connection-status">
			Connected to server: {{ isConnected ? 'Yes' : 'No' }}
		</div>
	</div>
</template>

<script>
export default {
	name: 'ShipPlacementPanel',
	props: {
		remainingShips: {
			type: Array,
			required: true,
		},
		chosenShipIndex: {
			type: Number,
			default: null,
		},
		isShipHorizontal: {
			type: Boolean,
			required: true,
		},
		highlightColor: {
			type: String,
			required: true,
		},
		highlightedShipIndex: {
			type: Number,
			default: null,
		},
		isConnected: {
			type: Boolean,
			required: true,
		},
	},
};
</script>
