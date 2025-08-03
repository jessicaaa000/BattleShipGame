<template>
	<div class="board-area">
		<h3>{{ title }}</h3>
		<div class="board" @contextmenu.prevent="$emit('contextmenu')">
			<div
				v-for="(row, rowIndex) in board"
				:key="'row-' + rowIndex"
				class="board-row"
			>
				<div
					v-for="(cell, colIndex) in row"
					:key="'cell-' + rowIndex + '-' + colIndex"
					:class="[
						'board-cell',
						{
							ship: cell === 1 && gamePhase === 'placement',
							'player-ship':
								cell === 1 &&
								gamePhase === 'playing' &&
								!isOpponent,
							hit: shotResults[rowIndex][colIndex] === 2,
							miss: shotResults[rowIndex][colIndex] === 3,
							sunk: shotResults[rowIndex][colIndex] === 4,
							'hover-valid':
								gamePhase === 'placement' &&
								!isOpponent &&
								isHoveringHere(rowIndex, colIndex) &&
								canPositionShip,
							'hover-invalid':
								gamePhase === 'placement' &&
								!isOpponent &&
								isHoveringHere(rowIndex, colIndex) &&
								!canPositionShip,
						},
					]"
					@mouseover="$emit('mouseover-cell', rowIndex, colIndex)"
					@mouseleave="$emit('mouseleave-cell')"
					@click="
						isOpponent && gamePhase === 'playing' && isPlayerTurn
							? $emit('fire-at', rowIndex, colIndex)
							: !isOpponent
							? $emit('click-cell', rowIndex, colIndex)
							: null
					"
				></div>
			</div>
		</div>

		<div class="stats-panel">
			<h3>{{ isOpponent ? "Opponent's stats" : "Your stats" }}</h3>
			<p>
				{{ isOpponent ? "Opponent's moves made" : "Yours moves made" }}:
				{{ moveCount }}
			</p>
			<p>
				{{ isOpponent ? "Opponent's sunk ships" : "Your sunk ships" }}:
				{{ sunkShips }}
			</p>
			<p>
				{{
					isOpponent
						? "Opponent's ships remaining"
						: "Your ships remaining"
				}}: {{ totalShips - sunkShips }}
			</p>
		</div>
	</div>
</template>

<script>
export default {
	name: 'GameBoard',
	props: {
		title: {
			type: String,
			required: true,
		},
		board: {
			type: Array,
			required: true,
		},
		shotResults: {
			type: Array,
			required: true,
		},
		isOpponent: {
			type: Boolean,
			required: true,
		},
		gamePhase: {
			type: String,
			required: true,
		},
		isPlayerTurn: {
			type: Boolean,
			default: false,
		},
		hoverCoordinates: {
			type: Object,
			default: () => ({ x: -1, y: -1 }),
		},
		canPositionShip: {
			type: Boolean,
			default: false,
		},
		shipPositionPreview: {
			type: Array,
			default: () => [],
		},
		moveCount: {
			type: Number,
			default: 0,
		},
		sunkShips: {
			type: Number,
			default: 0,
		},
		totalShips: {
			type: Number,
			default: 10,
		},
	},
	methods: {
		isHoveringHere(row, col) {
			return this.shipPositionPreview.some(
				(pos) => pos.x === row && pos.y === col
			);
		},
	},
};
</script>

<style scoped>
.board-cell.hover-valid {
	background-color: #9acd32;
}
.board-cell.hover-invalid {
	background-color: #ff6347;
}


.stats-panel {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px 15px 15px 15px;
  margin: 10px 10px 10px 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #7c7a7a;
  width: 100%;
  max-width: 300px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-panel:hover {
  transform: translateY(-4px);
   box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.stats-panel h3 {
  margin: 2px 2px 2px 2px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}
</style>
