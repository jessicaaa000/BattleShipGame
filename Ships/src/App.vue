<template>
	<div id="app">
		<BattleshipGame />
	</div>
</template>

<script>
import BattleshipGame from './components/BattleshipGame.vue';

export default {
	name: 'App',
	components: {
		BattleshipGame,
	},
};
</script>

<style>
@import './styles/battleship.css';
</style>
