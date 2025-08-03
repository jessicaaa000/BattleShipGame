# 🛳️ Battleship Game (Vue + Express)

A browser-based implementation of the classic Battleship game. Play solo against a computer opponent or compete online with another player in real-time. The game features a clean interface, dynamic gameplay, and a basic statistics system.

## 🎯 Features

- Play against computer AI with a simple logic and bonus moves for successful hits.
- Online multiplayer mode with room creation and joining using unique codes.
- Intuitive ship placement with real-time visual feedback and orientation control.
- Statistics tracking from your last 10 games (wins, losses, accuracy, game duration).
- Customizable board colors and responsive user interface.

## 💻 Technologies

- **Frontend:** Vue.js
- **Backend:** Express.js
- **Communication:** WebSocket / HTTP for multiplayer
- **Environment:** Node.js (LTS 16+)
- **Others:** HTML5, CSS3, JavaScript (ES6+)

---

## ⚙️ Requirements

- **Node.js** v16.x or newer  
- **Browser:** Chrome, Firefox, Edge, or Safari with JavaScript enabled
- **Editor (recommended):** Visual Studio Code

---

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/jessicaaa000/BattleShipGame.git
cd BattleShipGame
```

### 2. Install dependencies

#### Backend (Express.js)

```bash
cd server
npm install
```

#### Frontend (Vue.js)

In a new terminal:

```bash
cd client
npm install
```

### 3. Run the application

#### Backend

```bash
cd server
node app
# The server will run on port 3000
```

#### Frontend

In a separate terminal:

```bash
cd client
npm run serve
# The app will be available at http://localhost:8080 or if it is another run on http://localhost:8081 etc.
```

---

## 🕹️ How to Play

### 🔧 1. Ship Placement

- Drag ships onto a 10x10 board.
- Right-click to rotate.
- Green = valid position, Red = invalid.

### 🎮 2. Choose Game Mode

- **Single-player:** Computer AI automatically places its ships and takes turns.
- **Multiplayer:** Create a room and share the code or join an existing one.

### ⚔️ 3. Gameplay

- Changing turns with your opponent.
- A hit gives an extra move.
- Colors:
  - Light blue: miss
  - Red: hit
  - Black: sunken ship

---

## 📈 Statistics

Check the last 10 games' data at any time:
- Wins, losses
- Hit percentage
- Duration of each game

---

## 🔧 Project Structure & Modification

### Frontend

Located in the `client` folder. You can:
- Modify board visuals and logic
- Add effects (animations, sound)
- Change ship types or board size

### Backend

Located in the `server` folder. You can:
- Expand API logic
- Improve AI difficulty
- Add user authentication or game history

---

## 🔮 Future Ideas

- Multiple difficulty levels for AI
- Global ranking system
- Mobile-friendly design or native app
- Alternative game modes (e.g., bigger boards, new ship types)

---

## 📬 Contact

For questions or suggestions, feel free to open an issue on GitHub.