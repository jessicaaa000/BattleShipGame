const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let rooms = {};
let sockets = {};
let recentGames = [];
const MAX_GAMES = 10;
const GAME_HISTORY_FILE = path.join(__dirname, 'gameHistory.json');

// Load game history from file on startup
async function loadGameHistory() {
	try {
		const data = await fs.readFile(GAME_HISTORY_FILE, 'utf8');
		recentGames = JSON.parse(data);
		// Ensure only the last MAX_GAMES are kept
		if (recentGames.length > MAX_GAMES) {
			recentGames = recentGames.slice(-MAX_GAMES);
			await saveGameHistory(); // Save trimmed history
		}
		console.log(
			`Loaded ${recentGames.length} games from ${GAME_HISTORY_FILE}`
		);
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log(
				`No game history file found at ${GAME_HISTORY_FILE}. Starting with empty history.`
			);
			recentGames = [];
		} else {
			console.error('Error loading game history:', error);
		}
	}
}

// Save game history to file
async function saveGameHistory() {
	try {
		await fs.writeFile(
			GAME_HISTORY_FILE,
			JSON.stringify(recentGames, null, 2)
		);
		console.log(
			`Saved ${recentGames.length} games to ${GAME_HISTORY_FILE}`
		);
	} catch (error) {
		console.error('Error saving game history:', error);
	}
}

// Modified saveGameResult to include stats and save to file
async function saveGameResult(gameData) {
	if (recentGames.length >= MAX_GAMES) {
		recentGames.shift();
	}
	recentGames.push(gameData);
	await saveGameHistory();
}

function generateRoomCode(length = 8) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let code = '';
	for (let i = 0; i < length; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

app.get('/health', (req, res) => {
	res.status(200).send('OK');
});

app.get('/rooms', (req, res) => {
	res.json({ rooms });
});

// New endpoint to retrieve game history
app.get('/game-history', (req, res) => {
	res.json(recentGames);
});

app.post('/game-history', async (req, res) => {
    const gameData = req.body;
    if (!gameData.winner || !gameData.loser || !gameData.stats || !gameData.timestamp) {
        return res.status(400).json({ error: 'Invalid game data' });
    }
    try {
        if (recentGames.length >= MAX_GAMES) {
            recentGames.shift();
        }
        recentGames.push(gameData);
        console.log('Saving game data:', gameData);
        await saveGameHistory();
        res.status(201).json({ message: 'Game history saved' });
    } catch (error) {
        console.error('Error saving game history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/create-room', (req, res) => {
	try {
		console.log('Received create-room request:', req.body);
		const { username, board, ships } = req.body;

		if (!username || !board || !ships) {
			return res
				.status(400)
				.json({ error: 'Username, board and ships are required' });
		}

		if (!Array.isArray(board) || !Array.isArray(board[0])) {
			console.log('Invalid board format:', board);
			return res.status(400).json({ error: 'Invalid board format' });
		}
		if (
			!Array.isArray(ships) ||
			!ships.every((s) => s.size && s.positions)
		) {
			console.log('Invalid ships format:', ships);
			return res.status(400).json({ error: 'Invalid ships format' });
		}

		const roomCode = generateRoomCode();
		rooms[roomCode] = {
			host: username,
			guest: null,
			boards: { [username]: board },
			ships: { [username]: ships },
			clients: [],
			currentTurn: username,
			stats: {
				[username]: {
					moveCount: 0,
					sunkShips: 0,
					totalShips: ships.length,
				},
			},
		};

		const socketAddress = `ws://localhost:${port}/${roomCode}`;
		sockets[roomCode] = socketAddress;

		res.json({
			message: `Successfully created room ${roomCode}`,
			roomCode,
			socketAddress,
		});
	} catch (error) {
		console.error('Error in /create-room:', error.stack); // Szczegółowy log błędu
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.post('/join-room', (req, res) => {
	const { username, roomCode, board, ships } = req.body;

	if (!username || !roomCode || !board || !ships) {
		return res.status(400).json({
			error: 'Username, roomCode, board and ships are required',
		});
	}

	if (!rooms[roomCode]) {
		return res.status(404).json({ error: 'Room not found' });
	}

	if (rooms[roomCode].host === username) {
		return res.status(400).json({ error: 'Change username' });
	}

	if (rooms[roomCode].guest) {
		return res.status(400).json({ error: 'Room is already full' });
	}

	rooms[roomCode].guest = username;
	rooms[roomCode].boards[username] = board;
	rooms[roomCode].ships[username] = ships;
	rooms[roomCode].stats[username] = {
		moveCount: 0,
		sunkShips: 0,
		totalShips: ships.length,
	};

	res.json({
		message: `Successfully joined room ${roomCode}`,
		socketAddress: sockets[roomCode],
	});
});

// Funkcja sprawdzająca, czy gracz wygrał
function checkWinCondition(board) {
	return board.every((row) => row.every((cell) => cell !== 1)); // Wszystkie statki zatopione (brak 1)
}

function checkIfShipSunk(ships, shotRow, shotCol, board) {
	for (const ship of ships) {
		// Sprawdź, czy strzał trafił w pozycję statku
		const hitPosition = ship.positions.find(
			(pos) => pos.x === shotRow && pos.y === shotCol
		);
		if (hitPosition) {
			ship.hits = (ship.hits || 0) + 1;
			// Sprawdź, czy statek jest zatopiony
			if (ship.hits === ship.size) {
				// statek zatopiony
				ship.positions.forEach((pos) => {
					board[pos.x + 1][pos.y + 1] = 4; //offset
				});
				return true;
			}
			return false;
		}
	}
	return false;
}

wss.on('connection', (ws, req) => {
	const roomCode = req.url.replace('/', '');

	if (!rooms[roomCode]) {
		ws.close();
		return;
	}

	rooms[roomCode].clients.push(ws);
	console.log(
		`Client connected to room ${roomCode}. Total clients: ${rooms[roomCode].clients.length}`
	);

	// Powiadom klientów o rozpoczęciu gry, gdy obaj są podłączeni
	if (rooms[roomCode].clients.length === 2) {
		rooms[roomCode].clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(
					JSON.stringify({
						type: 'game_start',
						currentTurn: rooms[roomCode].currentTurn,
						stats: rooms[roomCode].stats,
					})
				);
			}
		});
	}

	ws.on('message', (message) => {
		const messageString = message.toString();
		let data;
		try {
			data = JSON.parse(messageString);
		} catch (error) {
			console.error('Invalid message format:', error);
			return;
		}

		if (data.type === 'shot') {
			const { row, col, username } = data;

			// Sprawdź, czy to tura tego gracza
			if (rooms[roomCode].currentTurn !== username) {
				ws.send(
					JSON.stringify({ type: 'error', message: 'Not your turn' })
				);
				return;
			}

			// Określ przeciwnika
			const opponent =
				rooms[roomCode].host === username
					? rooms[roomCode].guest
					: rooms[roomCode].host;
			const opponentBoard = rooms[roomCode].boards[opponent];
			const opponentShips = rooms[roomCode].ships[opponent];

			rooms[roomCode].stats[username].moveCount++;

			// Sprawdź trafienie
			const hit = opponentBoard[row + 1][col + 1] === 1;
			let sunk = false;
			if (hit) {
				opponentBoard[row + 1][col + 1] = 2; // Oznacz trafienie na planszy przeciwnika
				sunk = checkIfShipSunk(opponentShips, row, col, opponentBoard);
				if (sunk) {
					rooms[roomCode].stats[opponent].sunkShips++; // Zaktualizuj zatopione statki
					console.log('nazwa: ', opponent);
					console.log(
						'Sunk ships: ',
						rooms[roomCode].stats[opponent].sunkShips
					);
				}
			}

			// Prześlij informację o strzale do obu graczy
			rooms[roomCode].clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(
						JSON.stringify({
							type: 'shot_result',
							row,
							col,
							hit,
							sunk,
							username,
							opponent,
							stats: rooms[roomCode].stats,
						})
					);
				}
			});

			// Sprawdź, czy gra się zakończyła
			if (checkWinCondition(opponentBoard)) {
				const gameData = {
					winner: username,
					loser: opponent,
					stats: {
            		[username]: { ...rooms[roomCode].stats[username] },
            		[opponent]: { ...rooms[roomCode].stats[opponent] },
					},
					timestamp: new Date().toISOString(),
				};
				saveGameResult(gameData);
				console.log(recentGames)
				rooms[roomCode].clients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN) {
						client.send(
							JSON.stringify({
								type: 'game_over',
								winner: username,
								reason: 'ships_sunk',
							})
						);
					}
				});
				return;
			}

			// Zmień turę tylko w przypadku pudła
			if (!hit) {
				rooms[roomCode].currentTurn = opponent;
				rooms[roomCode].clients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN) {
						client.send(
							JSON.stringify({
								type: 'turn_change',
								currentTurn: rooms[roomCode].currentTurn,
							})
						);
					}
				});
			} else {
				// W przypadku trafienia, tura pozostaje u tego samego gracza
				rooms[roomCode].clients.forEach((client) => {
					if (client.readyState === WebSocket.OPEN) {
						client.send(
							JSON.stringify({
								type: 'turn_change',
								currentTurn: rooms[roomCode].currentTurn, // Tura pozostaje taka sama
							})
						);
					}
				});
			}
		}
	});

	ws.on('close', () => {
		// Check if the room still exists before proceeding
		if (!rooms[roomCode]) {
			console.log(`Room ${roomCode} no longer exists. Skipping cleanup.`);
			return;
		}

		rooms[roomCode].clients = rooms[roomCode].clients.filter(
			(client) => client !== ws
		);
		console.log(
			`Client disconnected from room ${roomCode}. Total clients: ${rooms[roomCode].clients.length}`
		);

		// If fewer than 2 clients remain, notify and clean up
		if (rooms[roomCode].clients.length < 2) {
			rooms[roomCode].clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(
						JSON.stringify({
							type: 'game_over',
							message: 'Opponent disconnected',
						})
					);
				}
			});
			delete rooms[roomCode]; // Delete the room
			delete sockets[roomCode];
		}
	});
});

loadGameHistory().then(() => {
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}).catch((error) => {
    console.error('Failed to load game history on startup:', error);
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});
