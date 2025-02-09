import { useState, useEffect } from 'react';
import GameBoard from './GameBoard';
import PlayerList from './PlayerList';
import { socket } from '../../server/socket';

const Authorization = () => {
  const [nickname, setNickname] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [playersOnline, setPlayersOnline] = useState([]);

  useEffect(() => {
    socket.on('playersOnline', (players) => {
      console.log('Получен список игроков:', players);
    });
    socket.on('playersOnline', (players) => {
      if (Array.isArray(players)) {
        console.log('Обновлённый список игроков:', players);
        setPlayersOnline(players);
      } else {
        console.error('Ошибка: данные о игроках не пришли корректно');
      }
    });

    socket.on('roomCreated', (roomId) => {
      console.log('Комната создана:', roomId);
      setRoomId(roomId);
    });

    return () => {
      socket.off('playersOnline');
      socket.off('roomCreated');
    };
  }, []);

  const handleLogin = () => {
    if (nickname.trim()) {
      console.log('Отправка ника на сервер:', nickname);
      socket.emit('setNickname', nickname);
      setIsLoggedIn(true);
    }
  };

  return (
    <div>
      {!isLoggedIn ? (
        <div>
          <input
            type="text"
            placeholder="Введите ник"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button onClick={handleLogin}>Войти</button>
        </div>
      ) : (
        <>
          {!roomId ? (
            <PlayerList socket={socket} nickname={nickname} playersOnline={playersOnline} />
          ) : (
            <GameBoard socket={socket} roomId={roomId} nickname={nickname} />
          )}
        </>
      )}
    </div>
  );
};

export default Authorization;
