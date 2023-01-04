const { Server } = require("socket.io");
const PORT = process.env.PORT || 8080;

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let players = {};
let results = [];

io.on("connection", (socket) => {
  if (Object.keys(players).length === 2) {
    socket.emit(
      "error",
      "the game supports 2 players only, all slots occupied"
    );
    socket.disconnect(true);
    return;
  }

  socket.on("disconnect", () => {
    io.sockets.emit("error", "opponent has left the game");
    io.disconnectSockets();
    players = {};
    results = [];
  });

  players[socket.id] = { name: null, score: 0, totalTime: 0 };

  socket.on("setName", (name) => {
    const prevName = players[socket.id].name;
    players[socket.id].name = name;
    if (!prevName) {
      const readyPlayersNumber = Object.values(players).filter(
        (player) => player.name !== null
      ).length;
      if (!prevName && readyPlayersNumber === 2) {
        io.sockets.emit("newRound", {
          roundNumber: results.length,
          ballNumber: Math.floor(Math.random() * 8),
        });
      }
    }
  });

  socket.on("result", (roundNumber, time) => {
    if (!results[roundNumber]) {
      results.push(socket.id);
      players[socket.id].score = players[socket.id].score + 1;
      players[socket.id].totalTime = players[socket.id].totalTime + time;

      if (results.length === 5) {
        const winner = Object.values(players).find((p) => p.score >= 3);
        io.sockets.emit(
          "game winner",
          winner.name,
          winner.totalTime / winner.score
        );
        io.disconnectSockets();
        players = {};
        results = [];
      } else {
        io.sockets.emit("newRound", {
          roundNumber: results.length,
          ballNumber: Math.floor(Math.random() * 8),
        });
      }
    }
  });
});

io.listen(PORT);
