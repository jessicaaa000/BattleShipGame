<template>
    <div v-if="isVisible" class="modal-overlay">
        <div class="modal-content">
            <h2>Game Statistics</h2>
            <div v-if="gameHistory.length === 0" class="no-history">
                <p>No game history available.</p>
            </div>
            <div v-else class="history-table">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Winner</th>
                            <th>Loser</th>
                            <th>Winner Moves</th>
                            <th>Loser Moves</th>
                            <th>Winner Ship Sunk</th>
                            <th>Loser Ship Sunk</th>
                            <th>Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(game, index) in gameHistory" :key="index">
                            <td>{{ index + 1 }}</td>
                            <td>{{ game.winner }}</td>
                            <td>{{ game.loser }}</td>
                            <td>{{ game.stats?.[game.winner]?.moveCount }}</td>
                            <td>{{ game.stats?.[game.loser]?.moveCount}}</td>
                            <td>{{ game.stats?.[game.winner]?.sunkShips}}</td>
                            <td>{{ game.stats?.[game.loser]?.sunkShips}}</td>
                            <td>{{ formatDate(game.timestamp) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button class="close-button" @click="$emit('close')">Close</button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'GameHistoryModal',
    props: {
        isVisible: {
            type: Boolean,
            required: true,
        },
        gameHistory: {
            type: Array,
            required: true,
        },
    },
    methods: {
        formatDate(timestamp) {
            return new Date(timestamp).toLocaleString();
        },
    },
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

h2 {
    margin-top: 0;
    color: #333;
}

.no-history {
    text-align: center;
    color: #666;
}

.history-table {
    margin: 20px 0;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

th {
    background: #f4f4f4;
    color: #333;
}

tr:hover {
    background: #f9f9f9;
}

.close-button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.close-button:hover {
    background: #0056b3;
}
</style>