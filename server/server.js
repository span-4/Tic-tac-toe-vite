import http from 'http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

let board = Array(9).fill(null);
let isXTurn = true;
let players = {}; // { socket.id: 'X' или 'O' }
let playerCount = 0;

io.on('connection', (socket) => {
  console.log('Игрок подключился:', socket.id);

  const checkWinner = (board) => {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let [a, b, c] of winPatterns) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every((cell) => cell !== null) ? 'draw' : null;
  };

  // Назначаем игроку 'X' или 'O'
  if (playerCount < 2) {
    players[socket.id] = playerCount === 0 ? 'X' : 'O';
    playerCount++;
    socket.emit('playerSymbol', players[socket.id]);
  } else {
    socket.emit('spectator'); // Остальные будут просто смотреть
  }

  socket.emit('gameState', { board, isXTurn });

  socket.on('move', ({ index, symbol }) => {
    if (
      board[index] ||
      checkWinner(board) ||
      players[socket.id] !== symbol ||
      (isXTurn ? 'X' : 'O') !== symbol
    )
      return;

    board[index] = symbol;
    isXTurn = !isXTurn;

    io.emit('gameState', { board, isXTurn });
  });

  socket.on('reset', () => {
    board = Array(9).fill(null);
    isXTurn = true;
    io.emit('gameState', { board, isXTurn });
  });

  socket.on('disconnect', () => {
    console.log('Игрок отключился:', socket.id);
    delete players[socket.id];
    playerCount--;
  });
});

server.listen(3001, () => console.log(`Сервер запущен на 3001`));
