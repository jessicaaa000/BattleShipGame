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
