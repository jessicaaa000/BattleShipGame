<template>
	<div class="battleship-game">
		<div v-if="currentGamePhase === 'playing'" class="game-status">
			<p v-if="roomCode" class="room-code-display">
				Room Code: <strong>{{ roomCode }}</strong>
			</p>
			<p>
				Current Turn:
				{{ isPlayerTurn ? 'Your Turn' : "Opponent's Turn" }}
			</p>
			<div v-if="gameOver" class="game-over-overlay">
				<div class="game-over-message">
					<template v-if="gameOverReason === 'timeout'">
						Game Over! {{ winner }} wins due to
						{{ winner === username ? 'opponent' : 'your' }} timeout!
					</template>
					<template v-else-if="gameOverReason === 'disconnected'">
						Game Over! Opponent disconnected.
					</template>
					<template v-else>
						Game Over! The winner is {{ winner }} !
					</template>
				</div>
			</div>
		</div>
		<ShipPlacementPanel
			v-if="currentGamePhase === 'placement'"
			:remaining-ships="remainingShips"
			:chosen-ship-index="chosenShipIndex"
			:is-ship-horizontal="isShipHorizontal"
			:highlight-color="highlightColor"
			:highlighted-ship-index="highlightedShipIndex"
			:is-connected="isConnected"
			@highlight-ship="highlightShipOption"
			@remove-highlight="removeHighlight"
			@choose-ship="chooseShip"
			@toggle-orientation="toggleShipOrientation"
		/>
		<div v-if="currentGamePhase === 'placement' && allShipsPositioned">
			<button @click="selectPlayWithComputer" class="start-game-button">
				Play with Computer
			</button>
			<button @click="selectPlayWithFriend" class="start-game-button">
				Play with Friend
			</button>
		</div>
		<div v-if="currentGamePhase === 'placement'" class="cell-size-buttons">
			<p>Choose cell size:</p>
			<button @click="setCellSize(32)" class="size-button">Small</button>
			<button @click="setCellSize(40)" class="size-button">Medium</button>
			<button @click="setCellSize(50)" class="size-button">Large</button>
		</div>
		<p>Choose color:</p>
		<div class="color-picker">
			<label for="miss-color">Miss:</label>
			<input
				id="miss-color"
				type="color"
				:value="getComputedColor('--miss-color')"
				@input="setColor('--miss-color', $event.target.value)"
			/>

			<label for="sunk-color">Sunk:</label>
			<input
				id="sunk-color"
				type="color"
				:value="getComputedColor('--sunk-color')"
				@input="setColor('--sunk-color', $event.target.value)"
			/>

			<label for="hit-color">Hit:</label>
			<input
				id="hit-color"
				type="color"
				:value="getComputedColor('--hit-color')"
				@input="setColor('--hit-color', $event.target.value)"
			/>

			<label for="player-ship-color">Player Ship:</label>
			<input
				id="player-ship-color"
				type="color"
				:value="getComputedColor('--player-ship-color')"
				@input="setColor('--player-ship-color', $event.target.value)"
			/>
		</div>
		<MultiplayerOptions
			v-if="showMultiplayerOptions"
			:join-username="joinUsername"
			:room-code="roomCode"
			:create-username="createUsername"
			@update:join-username="joinUsername = $event"
			@update:room-code="roomCode = $event"
			@update:create-username="createUsername = $event"
			@join-room="joinRoom"
			@create-room="createRoom"
		/>
		<GameControls
			v-if="currentGamePhase === 'playing'"
			:is-player-turn="isPlayerTurn"
			:player-time="playerTime"
			:opponent-time="opponentTime"
			@fire-shot="fireShot"
		/>
		<div class="game-boards">
			<GameBoard
				:title="opponentBoardTitle"
				:board="visibleComputerBoard"
				:shot-results="computerShotResults"
				:is-opponent="true"
				:game-phase="currentGamePhase"
				:is-player-turn="isPlayerTurn"
				:move-count="opponentMoveCount"
				:sunk-ships="opponentSunkShips"
				:total-ships="opponentTotalShips"
				@fire-at="fireAtComputer"
			/>
			<GameBoard
				title="Your Board"
				:board="visiblePlayerBoard"
				:shot-results="playerShotResults"
				:is-opponent="false"
				:game-phase="currentGamePhase"
				:hover-coordinates="hoverCoordinates"
				:can-position-ship="canPositionShip"
				:ship-position-preview="shipPositionPreview"
				:move-count="playerMoveCount"
				:sunk-ships="playerSunkShips"
				:total-ships="playerTotalShips"
				@mouseover-cell="showShipPreview"
				@mouseleave-cell="hideShipPreview"
				@click-cell="positionPlayerShip"
				@contextmenu="toggleShipOrientation"
			/>
		</div>
		<div class="statistics-section">
			<button @click="openGameHistoryModal" class="stats-button">
				See statistics
			</button>
			<GameHistoryModal
				:is-visible="showGameHistoryModal"
				:game-history="gameHistory"
				@close="closeGameHistoryModal"
			/>
		</div>
	</div>
</template>

<script>
import ShipPlacementPanel from './ShipPlacementPanel.vue';
import GameBoard from './GameBoard.vue';
import MultiplayerOptions from './MultiplayerOptions.vue';
import GameControls from './GameControls.vue';
import {
	setupBoards,
	positionShip,
	checkIfShipSunk,
	beginGame,
} from '../logic/gameLogic';
import { placeComputerShips, computerFire } from '../logic/computerAI';
import { isShipPlacementValid } from '../logic/shipUtils';
import { connectToWebSocket } from '../services/websocketService';
import {
	checkServerConnection,
	createRoom,
	joinRoom,
} from '../services/apiService';
import GameHistoryModal from './GameHistoryModal.vue';

export default {
	name: 'BattleshipGame',
	components: {
		ShipPlacementPanel,
		GameBoard,
		MultiplayerOptions,
		GameControls,
		GameHistoryModal,
	},
	data() {
		return {
			websocket: null,
			gameHistory: [],
			isConnected: false,
			boardSize: 10,
			cellSize: 30,
			playerMoveCount: 0,
			playerSunkShips: 0,
			playerTotalShips: 10,
			opponentMoveCount: 0,
			opponentSunkShips: 0,
			opponentTotalShips: 10,
			computerBoard: [],
			playerBoard: [],
			computerShotResults: [],
			playerShotResults: [],
			shipTypes: [
				{ quantity: 1, size: 4 },
				{ quantity: 2, size: 3 },
				{ quantity: 3, size: 2 },
				{ quantity: 4, size: 1 },
			],
			remainingShips: [
				{ quantity: 1, size: 4 },
				{ quantity: 2, size: 3 },
				{ quantity: 3, size: 2 },
				{ quantity: 4, size: 1 },
			],
			computerShips: [],
			playerShips: [],
			chosenShipIndex: 0,
			highlightedShipIndex: null,
			highlightColor: '#9acd32',
			isShipHorizontal: true,
			hoverCoordinates: { x: -1, y: -1 },
			canPositionShip: false,
			shipPositionPreview: [],
			currentGamePhase: 'placement',
			isPlayerTurn: true,
			isDebugMode: true,
			probabilityMaps: [],
			showMultiplayerOptions: false,
			joinUsername: '',
			roomCode: '',
			createUsername: '',
			isMultiplayer: true,
			username: '',
			opponentUsername: '',
			gameOver: false,
			winner: null,
			playerTime: 300, // 5 minutes in seconds
			opponentTime: 300, // 5 minutes in seconds
			timerInterval: null,
			hasFirstMoveOccurred: false, // Tracks if first move's turn_change has occurred
			lastTimerUpdate: null, // Tracks last timer update timestamp
			gameOverReason: null, // Tracks reason for game over (timeout, ships_sunk, disconnected)
			showGameHistoryModal: false,
		};
	},
	watch: {
		cellSize(newSize) {
			document.documentElement.style.setProperty(
				'--cell-size',
				`${newSize}px`
			);
		},
	},
	computed: {
		visibleComputerBoard() {
			return this.computerBoard
				.slice(1, -1)
				.map((row) => row.slice(1, -1));
		},
		visiblePlayerBoard() {
			return this.playerBoard.slice(1, -1).map((row) => row.slice(1, -1));
		},
		selectedShip() {
			return this.chosenShipIndex !== null
				? this.remainingShips[this.chosenShipIndex]
				: null;
		},
		allShipsPositioned() {
			return this.remainingShips.every((ship) => ship.quantity === 0);
		},
		opponentBoardTitle() {
			return this.isMultiplayer ? "Friend's Board" : 'Computer Board';
		},
	},
	methods: {
		async fetchGameHistory() {
			try {
				const response = await fetch(
					'http://localhost:3000/game-history'
				);
				if (!response.ok) {
					throw new Error('Failed to fetch game history');
				}
				this.gameHistory = await response.json();
				console.log('Fetched game history:', this.gameHistory);
			} catch (error) {
				console.error('Error fetching game history:', error);
			}
		},
		formatDate(timestamp) {
			return new Date(timestamp).toLocaleString();
		},
		setCellSize(size) {
			this.cellSize = size; // Aktualizuje lokalną zmienną
			document.documentElement.style.setProperty(
				'--cell-size',
				`${size}px`
			); // Ustawia zmienną CSS
		},
		setColor(variable, color) {
			document.documentElement.style.setProperty(variable, color);
		},
		getComputedColor(variable) {
			return getComputedStyle(document.documentElement)
				.getPropertyValue(variable)
				.trim();
		},
		setupBoards() {
			const {
				computerBoard,
				playerBoard,
				computerShotResults,
				playerShotResults,
				computerShips,
				playerShips,
			} = setupBoards(this.boardSize);
			this.computerBoard = computerBoard;
			this.playerBoard = playerBoard;
			this.computerShotResults = computerShotResults;
			this.playerShotResults = playerShotResults;
			this.computerShips = computerShips;
			this.playerShips = playerShips;
			this.totalShips = this.computerShips.length;
			this.probabilityMaps = Array(5)
				.fill()
				.map(() =>
					Array(this.boardSize)
						.fill()
						.map(() => Array(this.boardSize).fill(0))
				);
		},
		highlightShipOption(index) {
			if (this.remainingShips[index].quantity > 0) {
				this.highlightedShipIndex = index;
			}
		},
		removeHighlight() {
			this.highlightedShipIndex = null;
		},
		chooseShip(index) {
			if (this.remainingShips[index].quantity > 0) {
				this.chosenShipIndex = index;
			}
		},
		toggleShipOrientation() {
			if (this.selectedShip && this.selectedShip.quantity > 0) {
				this.isShipHorizontal = !this.isShipHorizontal;
				if (
					this.hoverCoordinates.x >= 0 &&
					this.hoverCoordinates.y >= 0
				) {
					this.showShipPreview(
						this.hoverCoordinates.x,
						this.hoverCoordinates.y
					);
				}
			}
		},
		showShipPreview(row, col) {
			if (!this.selectedShip || this.selectedShip.quantity === 0) return;
			this.hideShipPreview();
			this.hoverCoordinates = { x: row, y: col };
			const boardX = row + 1;
			const boardY = col + 1;
			this.canPositionShip = isShipPlacementValid(
				boardX,
				boardY,
				this.selectedShip.size,
				this.isShipHorizontal,
				this.playerBoard,
				this.boardSize
			);
			this.shipPositionPreview = [];
			if (this.isShipHorizontal) {
				for (let i = 0; i < this.selectedShip.size; i++) {
					if (col + i < this.boardSize) {
						this.shipPositionPreview.push({ x: row, y: col + i });
					}
				}
			} else {
				for (let i = 0; i < this.selectedShip.size; i++) {
					if (row + i < this.boardSize) {
						this.shipPositionPreview.push({ x: row + i, y: col });
					}
				}
			}
			if (this.shipPositionPreview.length !== this.selectedShip.size) {
				this.canPositionShip = false;
			}
		},
		hideShipPreview() {
			this.shipPositionPreview = [];
			this.hoverCoordinates = { x: -1, y: -1 };
			this.canPositionShip = false;
		},
		positionPlayerShip(row, col) {
			if (
				!this.selectedShip ||
				this.selectedShip.quantity === 0 ||
				!this.canPositionShip
			)
				return;
			const boardX = row + 1;
			const boardY = col + 1;
			if (
				!isShipPlacementValid(
					boardX,
					boardY,
					this.selectedShip.size,
					this.isShipHorizontal,
					this.playerBoard,
					this.boardSize
				)
			)
				return;
			positionShip(
				boardX,
				boardY,
				this.selectedShip.size,
				this.isShipHorizontal,
				this.playerBoard,
				this.playerShips
			);
			this.remainingShips[this.chosenShipIndex].quantity--;
			if (this.remainingShips[this.chosenShipIndex].quantity === 0) {
				const nextAvailable = this.remainingShips.findIndex(
					(ship) => ship.quantity > 0
				);
				this.chosenShipIndex =
					nextAvailable !== -1 ? nextAvailable : null;
			}
			this.hideShipPreview();
			if (this.isDebugMode) {
				console.log('Player board:');
				for (let i = 0; i < this.playerBoard.length; i++) {
					console.log(this.playerBoard[i].join(' '));
				}
			}
		},
		selectPlayWithComputer() {
			this.isMultiplayer = false;
			this.opponentUsername = 'computer';
			console.log(
				'Playing with computer, isMultiplayer:',
				this.isMultiplayer
			);
			beginGame(this);
		},
		selectPlayWithFriend() {
			this.showMultiplayerOptions = true;
		},
		joinRoom() {
			this.username = this.joinUsername;
			joinRoom(
				this.joinUsername,
				this.roomCode,
				this.playerBoard,
				this.playerShips
			)
				.then((data) => {
					this.isConnected = true;
					this.roomCode = data.roomCode;
					if (data.socketAddress) {
						this.connectToWebSocket(data.socketAddress);
					}
				})
				.catch((error) => {
					this.isConnected = false;
					console.error('Failed to join room:', error);
					alert(
						'Failed to join room. Please check the room code and try again.'
					);
				});
		},
		createRoom() {
			this.username = this.createUsername;
			console.log('Creating room with:', {
				username: this.createUsername,
				playerBoard: this.playerBoard,
				playerShips: this.playerShips,
			});
			createRoom(this.createUsername, this.playerBoard, this.playerShips)
				.then((data) => {
					this.isConnected = true;
					this.roomCode = data.roomCode;
					alert(`Room created! Room code: ${data.roomCode}`);
					if (data.socketAddress) {
						this.connectToWebSocket(data.socketAddress);
					}
				})
				.catch((error) => {
					this.isConnected = false;
					console.error('Failed to create room:', error);
					alert('Failed to create room. Please try again.');
				});
		},
		connectToWebSocket(socketAddress) {
			this.websocket = connectToWebSocket(socketAddress, {
				onOpen: () => {
					this.isConnected = true;
					this.currentGamePhase = 'playing';
					this.showMultiplayerOptions = false;
				},
				onMessage: (data) => {
					if (data.type === 'game_start') {
						this.isPlayerTurn = data.currentTurn === this.username;
					} else if (data.type === 'shot_result') {
						if (data.username === this.username) {
							this.computerShotResults[data.row][data.col] =
								data.hit ? 2 : 3;
							this.playerMoveCount++;
						} else {
							this.playerShotResults[data.row][data.col] =
								data.hit ? 2 : 3;
						}
						if (data.stats) {
							const players = Object.keys(data.stats);
							this.opponent =
								players.find(
									(player) => player !== this.username
								) || this.opponent;
							// Initialize stats
							this.playerMoveCount =
								data.stats[this.username]?.moveCount ||
								this.playerMoveCount;
							this.playerSunkShips =
								data.stats[this.username]?.sunkShips ||
								this.playerSunkShips;
							this.playerTotalShips =
								data.stats[this.username]?.totalShips;
							this.opponentMoveCount =
								data.stats[this.opponent]?.moveCount ||
								this.opponentMoveCount;
							this.opponentSunkShips =
								data.stats[this.opponent]?.sunkShips ||
								this.opponentSunkShips;
							this.opponentTotalShips =
								data.stats[this.opponent]?.totalShips;
							console.log('Sunk ships', this.playerSunkShips);
							console.log(
								'liczba TotalShips:',
								this.playerTotalShips
							);
						}
						this.$forceUpdate();
					} else if (data.type === 'turn_change') {
						this.isPlayerTurn = data.currentTurn === this.username;
						if (!this.hasFirstMoveOccurred) {
							this.hasFirstMoveOccurred = true;
							this.startTimer();
						} else {
							this.updateTimer();
						}
					} else if (data.type === 'game_over') {
						this.gameOver = true;
						this.winner = data.winner || null;
						this.gameOverReason = data.reason || 'ships_sunk';
						if (this.isMultiplayer) {
							this.stopTimer();
						}
					} else if (data.type === 'error') {
						console.error(data.message);
					}
				},
				onClose: () => {
					this.isConnected = false;
					this.gameOver = true;
					this.gameOverReason = 'disconnected';
					if (this.isMultiplayer) {
						this.stopTimer();
					}
				},
				onError: (error) => {
					console.error('WebSocket error:', error);
				},
			});
		},
		fireShot() {
			const shot = {
				type: 'shot',
				row: 0,
				col: 0,
				username: this.username,
			};
			if (
				this.websocket &&
				this.websocket.readyState === WebSocket.OPEN
			) {
				this.websocket.send(JSON.stringify(shot));
				console.log('Shot fired:', shot);
			}
		},
		fireAtComputer(row, col) {
			if (!this.isMultiplayer) {
				if (
					(!this.isPlayerTurn &&
						this.computerShotResults[row][col] !== 0) ||
					this.gameOver
				)
					return;
				const boardX = row + 1;
				const boardY = col + 1;
				this.playerMoveCount++;
				let wasHit = false;
				console.log(
					'Inside 592 line, has firstMoveOccured?: ',
					this.hasFirstMoveOccurred
				);
				if (!this.hasFirstMoveOccurred) {
					this.hasFirstMoveOccurred = true;
					this.startTimer();
				} else {
					this.updateTimer();
				}
				if (this.computerBoard[boardX][boardY] === 1) {
					this.computerShotResults[row][col] = 2;
					wasHit = true;
					const sunk = checkIfShipSunk(
						this.computerShips,
						this.computerShotResults
					);
					if (sunk) {
						this.opponentSunkShips++;
						console.log(
							'Player sank a computer ship:',
							this.opponentSunkShips
						);
					}
				} else {
					this.computerShotResults[row][col] = 3;
				}
				console.log('Player stats:', {
					moveCount: this.playerMoveCount,
					sunkShips: this.playerSunkShips,
					totalShips: this.playerTotalShips,
				});
				console.log('Computer stats:', {
					moveCount: this.opponentMoveCount,
					sunkShips: this.opponentSunkShips,
					totalShips: this.opponentTotalShips,
				});
				if (this.playerSunkShips === this.computerShips.length) {
					this.opponentUsername = 'Computer';
					this.username = 'You';
					this.gameOver = true;
					this.winner = 'Computer';
					this.gameOverReason = 'ships_sunk';
					this.saveSinglePlayerGameResult(this.winner, 'You');
				}
				if (this.opponentSunkShips === this.computerShips.length) {
					this.opponentUsername = 'Computer';
					this.username = 'You';
					this.gameOver = true;
					this.winner = 'You';
					this.gameOverReason = 'ships_sunk';
					this.saveSinglePlayerGameResult(this.winner, 'Computer');
				} else if (!wasHit) {
					this.isPlayerTurn = false;
					this.$nextTick(() => computerFire(this));
				}
			} else {
				if (
					!this.isPlayerTurn ||
					this.computerShotResults[row][col] !== 0
				)
					return;
				const shot = {
					type: 'shot',
					row,
					col,
					username: this.username,
				};
				if (
					this.websocket &&
					this.websocket.readyState === WebSocket.OPEN
				) {
					this.websocket.send(JSON.stringify(shot));
					console.log('Shot fired:', shot);
				}
			}
		},
		startTimer() {
			if (!this.timerInterval && this.hasFirstMoveOccurred) {
				this.lastTimerUpdate = performance.now();
				const tick = () => {
					if (!this.gameOver && this.hasFirstMoveOccurred) {
						const now = performance.now();
						const elapsed = (now - this.lastTimerUpdate) / 1000; // Seconds
						if (elapsed >= 1) {
							if (this.isPlayerTurn) {
								this.playerTime = Math.max(
									0,
									this.playerTime - Math.floor(elapsed)
								);
								if (this.playerTime === 0) {
									this.handleTimeout('opponent');
								}
							} else {
								this.opponentTime = Math.max(
									0,
									this.opponentTime - Math.floor(elapsed)
								);
								if (this.opponentTime === 0) {
									this.handleTimeout('player');
								}
							}
							this.lastTimerUpdate = now;
						}
						this.timerInterval = requestAnimationFrame(tick);
					}
				};
				this.timerInterval = requestAnimationFrame(tick);
			}
		},
		updateTimer() {
			if (
				this.isMultiplayer &&
				this.hasFirstMoveOccurred &&
				this.timerInterval
			) {
				this.lastTimerUpdate = performance.now(); // Reset timestamp for smooth transition
			}
		},
		stopTimer() {
			if (this.timerInterval) {
				cancelAnimationFrame(this.timerInterval);
				this.timerInterval = null;
				this.lastTimerUpdate = null;
			}
		},
		handleTimeout(winner) {
			if (
				(this.isMultiplayer &&
					this.websocket &&
					this.websocket.readyState === WebSocket.OPEN) ||
				!this.isMultiplayer
			) {
				const gameOverMessage = {
					type: 'game_over',
					winner:
						winner === 'player'
							? this.username
							: this.opponentUsername || 'Opponent',
					reason: 'timeout',
				};
				if (this.isMultiplayer) {
					this.websocket.send(JSON.stringify(gameOverMessage));
				}
				this.gameOver = true;
				this.winner = gameOverMessage.winner;
				this.gameOverReason = 'timeout';
				this.stopTimer();
			}
		},
		openGameHistoryModal() {
			this.fetchGameHistory();
			this.showGameHistoryModal = true;
		},
		closeGameHistoryModal() {
			this.showGameHistoryModal = false;
		},
		async saveSinglePlayerGameResult(winner, loser) {
			const gameData = {
				winner,
				loser,
				stats: {
					[this.username]: {
						moveCount: this.playerMoveCount,
						sunkShips: this.playerSunkShips,
						totalShips: this.playerTotalShips,
					},
					Computer: {
						moveCount: this.opponentMoveCount,
						sunkShips: this.opponentSunkShips,
						totalShips: this.opponentTotalShips,
					},
				},
				timestamp: new Date().toISOString(),
			};
			try {
				const response = await fetch(
					'http://localhost:3000/game-history',
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(gameData),
					}
				);
				if (!response.ok) {
					throw new Error('Failed to save game history');
				}
				console.log('Saved single-player game result:', gameData);
				await this.fetchGameHistory();
			} catch (error) {
				console.error(
					'Error saving single-player game history:',
					error
				);
			}
		},
	},
	mounted() {
		placeComputerShips(this);
		checkServerConnection().then((isConnected) => {
			this.isConnected = isConnected;
		});
		this.chosenShipIndex = 0;
		document.documentElement.style.setProperty(
			'--cell-size',
			`${this.cellSize}px`
		);
		this.fetchGameHistory();
	},
	unmounted() {
		if (this.isMultiplayer) {
			this.stopTimer();
		}
	},
};
</script>
