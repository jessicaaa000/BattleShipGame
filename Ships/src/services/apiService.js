export async function checkServerConnection() {
	try {
		const response = await fetch('http://localhost:3000/health', {
			method: 'GET',
		});
		return response.ok;
	} catch (error) {
		console.error('Connection check failed:', error);
		return false;
	}
}

export async function joinRoom(username, roomCode, board, ships) {
	const response = await fetch('http://localhost:3000/join-room', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, roomCode, board, ships }),
	});
	if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	return response.json();
}

export async function createRoom(username, board, ships) {
	console.log('Sending create-room request:', { username, board, ships });
	const response = await fetch('http://localhost:3000/create-room', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, board, ships }),
	});
	if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	return response.json();
}
