import "./App.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
const socket = io("ws://192.168.1.185:3050");

function App() {
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [round, setRound] = useState(null);
  const [preparation, setPreparation] = useState(false);
  const [winner, setWinner] = useState(null);
  const [time, setTime] = useState(null);

  console.log("state", error, name, round, preparation, winner, time);

  useEffect(() => {
    socket.on("error", (data) => {
      console.log("received error", data);
      setError(data);
    });
    socket.on("newRound", (data) => {
      setRound({ number: data.roundNumber, ballNumber: data.ballNumber });
      setPreparation(true);
      setTimeout(() => {
        setPreparation(false);
        setTime(new Date().getTime());
      }, 3000);
    });
    socket.on("game winner", (name, avgTime) => {
      setWinner(
        `${name} has won the game, average time to win the round was ${Math.floor(
          avgTime
        )}ms`
      );
      setRound(null);
      setName(null);
    });
  }, []);

  if (error && !winner) {
    return <div className="App">{error}</div>;
  } else if (winner) {
    return <div className="App">{winner}</div>;
  } else if (preparation) {
    return <div className="App">get ready for the next round!</div>;
  } else if (round) {
    return (
      <div className="App">
        <div className="grid">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((ball, i) => {
            return ball === round.ballNumber ? (
              <div
                key={i}
                className="ball"
                style={{ backgroundColor: "#00ff0088" }}
                onClick={() => {
                  socket.emit(
                    "result",
                    round.number,
                    new Date().getTime() - time
                  );
                }}
              >
                <img src="https://demo.speedsize.com/task/ballgame/green-ball.avif" />
              </div>
            ) : (
              <div key={i} className="ball">
                <img src="https://demo.speedsize.com/task/ballgame/red-ball.avif" />
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    return (
      <div className="App">
        please enter your name and wait for the game to start
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        ></input>
        <button
          onClick={() => {
            socket.emit("setName", name);
          }}
        >
          set name
        </button>
      </div>
    );
  }
}

export default App;
