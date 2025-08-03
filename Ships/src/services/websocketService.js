export function connectToWebSocket(
	socketAddress,
	{ onOpen, onMessage, onClose, onError }
) {
	const websocket = new WebSocket(socketAddress);

	websocket.onopen = () => {
		console.log('Connected to WebSocket server');
		onOpen();
	};

	websocket.onmessage = async (event) => {
		let messageData;
		if (event.data instanceof Blob) {
			messageData = await event.data.text();
			console.log('Message data z websocket onmessage: ', messageData);
		} else {
			messageData = event.data;
		}

		try {
			const data = JSON.parse(messageData);
			console.log('Received message:', data);
			onMessage(data);
		} catch (error) {
			console.error('Failed to parse WebSocket message:', error);
		}
	};

	websocket.onclose = () => {
		console.log('Disconnected from WebSocket server');
		onClose();
	};

	websocket.onerror = (error) => {
		console.error('WebSocket error:', error);
		onError(error);
	};

	return websocket;
}
