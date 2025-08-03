import { isShipPlacementValid } from './shipUtils';
import { positionShip, checkIfShipSunk } from './gameLogic';

export function placeComputerShips(context) {
	context.setupBoards();
	for (const ship of context.shipTypes) {
		for (let i = 0; i < ship.quantity; i++) {
			let isPlaced = false;
			while (!isPlaced) {
				const x =
					Math.floor(
						Math.random() * (context.boardSize - ship.size + 1)
					) + 1;
				const y =
					Math.floor(
						Math.random() * (context.boardSize - ship.size + 1)
					) + 1;
				const isHorizontal = Math.random() < 0.5;
				if (
					isShipPlacementValid(
						x,
						y,
						ship.size,
						isHorizontal,
						context.computerBoard,
						context.boardSize
					)
				) {
					positionShip(
						x,
						y,
						ship.size,
						isHorizontal,
						context.computerBoard,
						context.computerShips
					);
					isPlaced = true;
				}
			}
		}
	}
}

export function generateProbabilityMaps(context) {
	// Inicjalizuj context.probabilityMaps, jeśli nie istnieje
	if (!context.probabilityMaps) {
		context.probabilityMaps = Array(5)
			.fill()
			.map(() =>
				Array(context.boardSize)
					.fill()
					.map(() => Array(context.boardSize).fill(0))
			);
	}

	// Czyść istniejące mapy
	for (let i = 0; i < 5; i++) {
		for (let row = 0; row < context.boardSize; row++) {
			for (let col = 0; col < context.boardSize; col++) {
				context.probabilityMaps[i][row][col] = 0;
			}
		}
	}

	const shipSizes = [1, 2, 3, 4];
	const shotResults = context.playerShotResults;

	const invalidMask = Array(context.boardSize)
		.fill()
		.map(() => Array(context.boardSize).fill(false));

	context.playerShips.forEach((ship) => {
		if (ship.hits === ship.size) {
			ship.positions.forEach((pos) => {
				for (let dx = -1; dx <= 1; dx++) {
					for (let dy = -1; dy <= 1; dy++) {
						const checkX = pos.x + dx;
						const checkY = pos.y + dy;
						if (
							checkX >= 0 &&
							checkX < context.boardSize &&
							checkY >= 0 &&
							checkY < context.boardSize
						) {
							invalidMask[checkX][checkY] = true;
						}
					}
				}
			});
		}
	});

	for (let row = 0; row < context.boardSize; row++) {
		for (let col = 0; col < context.boardSize; col++) {
			if (shotResults[row][col] === 3 || shotResults[row][col] === 4) {
				invalidMask[row][col] = true;
			}
		}
	}

	shipSizes.forEach((size, mapIndex) => {
		for (let row = 0; row < context.boardSize; row++) {
			for (let col = 0; col < context.boardSize; col++) {
				if (invalidMask[row][col]) continue;
				if (size === 1) {
					if (shotResults[row][col] === 0) {
						context.probabilityMaps[mapIndex][row][col]++;
					}
				} else {
					if (col + size <= context.boardSize) {
						let canPlace = true;
						for (let i = 0; i < size; i++) {
							if (
								invalidMask[row][col + i] ||
								shotResults[row][col + i] === 2
							) {
								canPlace = false;
								break;
							}
						}
						if (canPlace) {
							for (let i = 0; i < size; i++) {
								context.probabilityMaps[mapIndex][row][
									col + i
								]++;
							}
						}
					}
					if (row + size <= context.boardSize) {
						let canPlace = true;
						for (let i = 0; i < size; i++) {
							if (
								invalidMask[row + i][col] ||
								shotResults[row + i][col] === 2
							) {
								canPlace = false;
								break;
							}
						}
						if (canPlace) {
							for (let i = 0; i < size; i++) {
								context.probabilityMaps[mapIndex][row + i][
									col
								]++;
							}
						}
					}
				}
			}
		}
	});

	for (let row = 0; row < context.boardSize; row++) {
		for (let col = 0; col < context.boardSize; col++) {
			context.probabilityMaps[4][row][col] =
				context.probabilityMaps[0][row][col] +
				context.probabilityMaps[1][row][col] +
				context.probabilityMaps[2][row][col] +
				context.probabilityMaps[3][row][col];
		}
	}

	if (context.isDebugMode) {
		console.log('Probability Maps:');
		console.log(
			'Size 1:',
			context.probabilityMaps[0].map((row) => row.join(' '))
		);
		console.log(
			'Size 2:',
			context.probabilityMaps[1].map((row) => row.join(' '))
		);
		console.log(
			'Size 3:',
			context.probabilityMaps[2].map((row) => row.join(' '))
		);
		console.log(
			'Size 4:',
			context.probabilityMaps[3].map((row) => row.join(' '))
		);
		console.log(
			'Sum:',
			context.probabilityMaps[4].map((row) => row.join(' '))
		);
	}

	return invalidMask;
}

export function computerFire(context) {
	let wasHit = false;
	const hitCells = [];
	for (let row = 0; row < context.boardSize; row++) {
		for (let col = 0; col < context.boardSize; col++) {
			if (context.playerShotResults[row][col] === 2) {
				hitCells.push({ row, col });
			}
		}
	}

	let targetRow = undefined;
	let targetCol = undefined;

	const invalidMask = generateProbabilityMaps(context);
	if (hitCells.length > 0) {
		let direction = null;
		if (hitCells.length > 1) {
			if (hitCells.every((cell) => cell.col === hitCells[0].col)) {
				direction = 'vertical';
			} else if (hitCells.every((cell) => cell.row === hitCells[0].row)) {
				direction = 'horizontal';
			}
		}

		if (direction === 'vertical') {
			const minRow = Math.min(...hitCells.map((cell) => cell.row));
			const maxRow = Math.max(...hitCells.map((cell) => cell.row));
			const col = hitCells[0].col;

			if (
				minRow - 1 >= 0 &&
				context.playerShotResults[minRow - 1][col] === 0 &&
				!invalidMask[minRow - 1][col]
			) {
				targetRow = minRow - 1;
				targetCol = col;
			} else if (
				maxRow + 1 < context.boardSize &&
				context.playerShotResults[maxRow + 1][col] === 0 &&
				!invalidMask[maxRow + 1][col]
			) {
				targetRow = maxRow + 1;
				targetCol = col;
			}
		} else if (direction === 'horizontal') {
			const minCol = Math.min(...hitCells.map((cell) => cell.col));
			const maxCol = Math.max(...hitCells.map((cell) => cell.col));
			const row = hitCells[0].row;

			if (
				minCol - 1 >= 0 &&
				context.playerShotResults[row][minCol - 1] === 0 &&
				!invalidMask[row][minCol - 1]
			) {
				targetRow = row;
				targetCol = minCol - 1;
			} else if (
				maxCol + 1 < context.boardSize &&
				context.playerShotResults[row][maxCol + 1] === 0 &&
				!invalidMask[row][maxCol + 1]
			) {
				targetRow = row;
				targetCol = maxCol + 1;
			}
		} else {
			const { row, col } = hitCells[0];
			const possibleTargets = [
				{ row: row - 1, col },
				{ row: row + 1, col },
				{ row, col: col - 1 },
				{ row, col: col + 1 },
			].filter(
				(target) =>
					target.row >= 0 &&
					target.row < context.boardSize &&
					target.col >= 0 &&
					target.col < context.boardSize &&
					context.playerShotResults[target.row][target.col] === 0 &&
					!invalidMask[target.row][target.col]
			);

			if (possibleTargets.length > 0) {
				const target =
					possibleTargets[
						Math.floor(Math.random() * possibleTargets.length)
					];
				targetRow = target.row;
				targetCol = target.col;
			}
		}

		if (targetRow !== undefined && targetCol !== undefined) {
			setTimeout(() => {
				context.opponentMoveCount++;
				if (context.playerBoard[targetRow + 1][targetCol + 1] === 1) {
					context.playerShotResults[targetRow][targetCol] = 2;
					wasHit = true;
					const sunk = checkIfShipSunk(
						context.playerShips,
						context.playerShotResults
					);
					if (sunk) {
						context.playerSunkShips++;
						console.log(
							'Computer sank a player ship:',
							context.playerSunkShips
						);
					}
				} else {
					context.playerShotResults[targetRow][targetCol] = 3;
				}
				console.log(
					`Computer fires at (${targetRow}, ${targetCol}) - ${
						wasHit ? 'Hit' : 'Miss'
					}`
				);
				context.$forceUpdate();
				finishTurn(context, wasHit);
			}, 1000);
			return;
		}
	}

	if (
		!hitCells.length ||
		(targetRow === undefined && targetCol === undefined)
	) {
		let maxProbability = -1;
		const highestProbabilityCells = [];

		for (let row = 0; row < context.boardSize; row++) {
			for (let col = 0; col < context.boardSize; col++) {
				if (
					context.playerShotResults[row][col] === 0 &&
					!invalidMask[row][col]
				) {
					const prob = context.probabilityMaps[4][row][col];
					if (prob > maxProbability) {
						maxProbability = prob;
						highestProbabilityCells.length = 0;
						highestProbabilityCells.push({ row, col });
					} else if (prob === maxProbability) {
						highestProbabilityCells.push({ row, col });
					}
				}
			}
		}

		if (highestProbabilityCells.length > 0) {
			const target =
				highestProbabilityCells[
					Math.floor(Math.random() * highestProbabilityCells.length)
				];
			targetRow = target.row;
			targetCol = target.col;

			setTimeout(() => {
				context.opponentMoveCount++;
				if (context.playerBoard[targetRow + 1][targetCol + 1] === 1) {
					context.playerShotResults[targetRow][targetCol] = 2;
					wasHit = true;
					const sunk = checkIfShipSunk(
						context.playerShips,
						context.playerShotResults
					);
					if (sunk) {
						context.playerSunkShips++;
						console.log(
							'Computer sank a player ship:',
							context.playerSunkShips
						);
					}
				} else {
					context.playerShotResults[targetRow][targetCol] = 3;
				}
				console.log(
					`Computer fires at (${targetRow}, ${targetCol}) - ${
						wasHit ? 'Hit' : 'Miss'
					}`
				);
				finishTurn(context, wasHit);
			}, 1000);
			return;
		}
	}

	// Check for game over (all player ships sunk)
	if (context.playerSunkShips === context.playerTotalShips) {
		context.gameOver = true;
		context.winner = 'Computer';
		context.gameOverReason = 'ships_sunk';
		saveSinglePlayerGameResult(context, 'Computer', context.username);
	} else if (context.opponentSunkShips === context.opponentTotalShips) {
		context.gameOver = true;
		context.winner = 'You';
		context.gameOverReason = 'ships_sunk';
		saveSinglePlayerGameResult(context, context.username, 'Computer');
	}
}

async function saveSinglePlayerGameResult(game, winner, loser) {
	const gameData = {
		winner,
		loser,
		stats: {
			[game.username]: {
				moveCount: game.playerMoveCount,
				sunkShips: game.playerSunkShips,
				totalShips: game.playerTotalShips,
			},
			Computer: {
				moveCount: game.opponentMoveCount,
				sunkShips: game.opponentSunkShips,
				totalShips: game.opponentTotalShips,
			},
		},
		timestamp: new Date().toISOString(),
	};

	try {
		const response = await fetch('http://localhost:3000/game-history', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(gameData),
		});
		if (!response.ok) {
			throw new Error('Failed to save game history');
		}
		console.log('Saved single-player game result:', gameData);
		game.gameOver = true;
		game.winner = winner;
		game.gameOverReason = 'ships_sunk';
	} catch (error) {
		console.error('Error saving single-player game history:', error);
	}
}

function finishTurn(context, wasHit) {
	if (wasHit) {
		context.$nextTick(() => {
			setTimeout(() => computerFire(context), 1000);
		});
	} else {
		context.isPlayerTurn = true;
	}
}
