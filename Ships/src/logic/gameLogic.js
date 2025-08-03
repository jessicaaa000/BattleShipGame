export function setupBoards(boardSize) {
	const computerBoard = Array(boardSize + 2)
		.fill()
		.map(() => Array(boardSize + 2).fill(0));
	const playerBoard = Array(boardSize + 2)
		.fill()
		.map(() => Array(boardSize + 2).fill(0));
	const computerShotResults = Array(boardSize)
		.fill()
		.map(() => Array(boardSize).fill(0));
	const playerShotResults = Array(boardSize)
		.fill()
		.map(() => Array(boardSize).fill(0));
	const computerShips = [];
	const playerShips = [];
	return {
		computerBoard,
		playerBoard,
		computerShotResults,
		playerShotResults,
		computerShips,
		playerShips,
	};
}

export function positionShip(x, y, size, isHorizontal, targetBoard, shipList) {
	const shipPositions = [];
	for (let i = 0; i < size; i++) {
		const posX = isHorizontal ? x : x + i;
		const posY = isHorizontal ? y + i : y;
		targetBoard[posX][posY] = 1;
		shipPositions.push({ x: posX - 1, y: posY - 1 });
	}
	if (shipList) {
		shipList.push({ size, positions: shipPositions, hits: 0 });
	}
}

export function checkIfShipSunk(ships, shotResults) {
	for (const ship of ships) {
		const hitCount = ship.positions.reduce((count, pos) => {
			return count + (shotResults[pos.x][pos.y] === 2 ? 1 : 0);
		}, 0);
		if (hitCount === ship.size && ship.hits !== ship.size) {
			ship.positions.forEach((pos) => {
				shotResults[pos.x][pos.y] = 4;
			});
			ship.hits = ship.size;
			console.log(`Ship of size ${ship.size} down`);
			return true;
		}
	}
	return false;
}

export function beginGame(context) {
	context.currentGamePhase = 'playing';
	context.isPlayerTurn = true;
}

export function isShipPlacementValid(
	x,
	y,
	size,
	isHorizontal,
	targetBoard,
	boardSize
) {
	if (
		isHorizontal &&
		(x < 1 || y < 1 || x > boardSize || y + size - 1 > boardSize)
	) {
		return false;
	}
	if (
		!isHorizontal &&
		(x < 1 || y < 1 || x + size - 1 > boardSize || y > boardSize)
	) {
		return false;
	}
	for (let i = 0; i < size; i++) {
		const posX = isHorizontal ? x : x + i;
		const posY = isHorizontal ? y + i : y;
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				const checkX = posX + dx;
				const checkY = posY + dy;
				if (
					checkX >= 0 &&
					checkX < boardSize + 2 &&
					checkY >= 0 &&
					checkY < boardSize + 2 &&
					targetBoard[checkX][checkY] !== 0
				) {
					return false;
				}
			}
		}
	}
	return true;
}
