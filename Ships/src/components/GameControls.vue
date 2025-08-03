<template>
	<div class="game-controls">
		<div class="timer-display">
			<div :class="['timer', { 'active-timer': isPlayerTurn }]">
				<span>Your Time: {{ formattedPlayerTime }}</span>
			</div>
			<div :class="['timer', { 'active-timer': !isPlayerTurn }]">
				<span>Opponent's Time: {{ formattedOpponentTime }}</span>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'GameControls',
	props: {
		isPlayerTurn: {
			type: Boolean,
			required: true,
		},
		playerTime: {
			type: Number,
			default: 300,
		},
		opponentTime: {
			type: Number,
			default: 300,
		},
	},
	computed: {
		formattedPlayerTime() {
			const minutes = Math.floor(this.playerTime / 60);
			const seconds = this.playerTime % 60;
			return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
		},
		formattedOpponentTime() {
			const minutes = Math.floor(this.opponentTime / 60);
			const seconds = this.opponentTime % 60;
			return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
		},
	},
};
</script>

<style scoped>
.timer-display {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10px;
}

.timer {
	padding: 5px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
}

.active-timer {
	background-color: #e0ffe0;
	border-color: #4caf50;
}
</style>
