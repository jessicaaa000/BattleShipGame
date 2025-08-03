<template>
	<div class="multiplayer-options">
		<div class="join-room-section">
			<h4>Join Room</h4>
			<input
				:value="joinUsername"
				@type="text"
				placeholder="Username"
				class="text-input"
				@input="$emit('update:join-username', $event.target.value)"
			/>
			<input
				:value="roomCode"
				type="text"
				placeholder="Room Code"
				class="text-input"
				@input="$emit('update:room-code', $event.target.value)"
			/>
			<button @click="$emit('join-room')" class="action-button">
				Join Room
			</button>
		</div>
		<div class="create-room-section">
			<h4>Create Room</h4>
			<input
				:value="createUsername"
				type="text"
				placeholder="Username"
				class="text-input"
				@input="$emit('update:create-username', $event.target.value)"
			/>
			<button @click="$emit('create-room')" class="action-button">
				Create Room
			</button>
		</div>
	</div>
</template>

<script>
export default {
	name: 'MultiplayerOptions',
	props: {
		joinUsername: {
			type: String,
			required: true,
		},
		roomCode: {
			type: String,
			required: true,
		},
		createUsername: {
			type: String,
			required: true,
		},
	},
};
</script>
