import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let players = {}; // { socketId: { nickname, roomId } }
let invites = {}; // { toSocketId: fromSocketId }
let rooms = {}; // { roomId: [socketId1, socketId2] }

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  // Установка ника
  socket.on('setNickname', (nickname) => {
    players[socket.id] = { nickname, roomId: null };
    io.emit('playersOnline', Object.values(players).map((player) => player.nickname) || []);
  });

  // Отправка приглашения
  socket.on('sendInvite', ({ from, to }) => {
    const toSocketId = Object.keys(players).find((key) => players[key].nickname === to);
    if (toSocketId) {
      invites[toSocketId] = socket.id; // Запоминаем, кто отправил приглашение
      io.to(toSocketId).emit('inviteReceived', from);
    }
  });

  // Принятие приглашения
  socket.on('acceptInvite', ({ from, to }) => {
    const fromSocketId = Object.keys(players).find((key) => players[key].nickname === from);
    const toSocketId = Object.keys(players).find((key) => players[key].nickname === to);

    if (fromSocketId && toSocketId) {
      const roomId = `${fromSocketId}-${toSocketId}`; // Создаем уникальный ID комнаты
      rooms[roomId] = [fromSocketId, toSocketId];
      players[fromSocketId].roomId = roomId;
      players[toSocketId].roomId = roomId;

      socket.join(roomId);
      io.to(fromSocketId).emit('roomCreated', roomId);
      io.to(toSocketId).emit('roomCreated', roomId);

      // Отправляем символы игрокам
      io.to(fromSocketId).emit('playerSymbol', 'X'); // Первый игрок получает X
      io.to(toSocketId).emit('playerSymbol', 'O'); // Второй игрок получает O

      // Обновляем список игроков, исключая тех, кто в комнате
      const updatedPlayers = Object.values(players)
        .filter((player) => !player.roomId) // Исключаем игроков, которые уже в комнате
        .map((player) => player.nickname);

      io.emit('playersOnline', updatedPlayers);

      // Начинаем игру
      io.to(roomId).emit('gameReady', {
        board: Array(9).fill(null),
        isXTurn: true,
      });
    }
  });

  // Обработка хода
  socket.on('move', ({ roomId, index, symbol }) => {
    const room = rooms[roomId];
    if (room && room.includes(socket.id)) {
      io.to(roomId).emit('gameState', { index, symbol });
    }
  });

  // Отключение игрока
  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
    const player = players[socket.id];
    if (player && player.roomId) {
      const roomId = player.roomId;
      delete rooms[roomId];
      io.to(roomId).emit('roomClosed');
    }
    delete players[socket.id];
    const playerList = Object.values(players).map((p) => p.nickname);
    console.log('Отправляю список игроков:', playerList);
    io.emit('playersOnline', playerList);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Сервер запущен на ${PORT}`));
