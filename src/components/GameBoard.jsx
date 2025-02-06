import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://tic-tac-toe-server-t4vx.onrender.com');

socket.on('connect', () => {
  console.log('Connected to server');
});

const GameBoard = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);

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

  useEffect(() => {
    socket.on('playerSymbol', (symbol) => setPlayerSymbol(symbol));
    socket.on('spectator', () => setIsSpectator(true));

    socket.on('gameState', ({ board, isXTurn }) => {
      setBoard(board);
      setIsXTurn(isXTurn);
      setWinner(checkWinner(board));
    });

    return () => {
      socket.off('playerSymbol');
      socket.off('spectator');
      socket.off('gameState');
    };
  }, []);

  const handleClick = (index) => {
    if (board[index] || winner || isSpectator || (isXTurn ? 'X' : 'O') !== playerSymbol) return;
    socket.emit('move', { index, symbol: playerSymbol });
  };

  const handleReset = () => {
    if (isSpectator) return;
    socket.emit('reset');
  };

  const backgroundColor = winner
    ? winner === 'X'
      ? '#d4edda'
      : winner === 'O'
      ? '#f8d7da'
      : '#f0e68c'
    : '#afaff9';
  const resetButtonStyle =
    winner || board.every((cell) => cell !== null)
      ? { backgroundColor: '#6c757d', color: '#fff' }
      : {};

  return (
    <div className="game-container" style={{ backgroundColor }}>
      <h2 className="status">
        {isSpectator
          ? 'Вы наблюдаете за игрой'
          : winner
          ? winner === 'draw'
            ? 'Ничья!'
            : `Победитель: ${winner}`
          : `Ваш символ: ${playerSymbol} | Ходит: ${isXTurn ? 'X' : 'O'}`}
      </h2>
      <div className="board">
        {board.map((cell, index) => (
          <div key={index} className="cell" onClick={() => handleClick(index)}>
            {cell}
          </div>
        ))}
      </div>
      <button
        className="reset-btn"
        style={resetButtonStyle}
        onClick={handleReset}
        disabled={isSpectator}>
        Сброс
      </button>
    </div>
  );
};

export default GameBoard;
