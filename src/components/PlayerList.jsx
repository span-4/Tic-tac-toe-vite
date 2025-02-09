import { useState, useEffect } from 'react';

const PlayerList = ({ socket, nickname, playersOnline }) => {
  console.log(
    'Players Online in PlayerList:',
    Array.isArray(playersOnline) ? playersOnline : 'ОШИБКА: playersOnline не массив!',
  );

  if (!Array.isArray(playersOnline)) {
    return <div>Загрузка списка игроков...</div>;
  }
  if (playersOnline.length === 0) {
    return <div>Нет доступных игроков.</div>;
  }

  const [invite, setInvite] = useState(null);

  useEffect(() => {
    socket.on('inviteReceived', (from) => {
      setInvite(from);
    });

    return () => {
      socket.off('inviteReceived');
    };
  }, [socket]);

  const sendInvite = (to) => {
    socket.emit('sendInvite', { from: nickname, to });
  };

  const acceptInvite = () => {
    socket.emit('acceptInvite', { from: invite, to: nickname });
    setInvite(null);
  };

  const declineInvite = () => {
    setInvite(null);
  };

  return (
    <div>
      <h3>Игроки онлайн:</h3>
      <ul>
        {playersOnline
          .filter((player) => player !== nickname) // Исключаем себя из списка
          .map((player, index) => (
            <li key={index}>
              {player} <button onClick={() => sendInvite(player)}>Пригласить</button>
            </li>
          ))}
      </ul>
      {invite && (
        <div>
          <p>{invite} пригласил вас в игру</p>
          <button onClick={acceptInvite}>Принять</button>
          <button onClick={declineInvite}>Отклонить</button>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
