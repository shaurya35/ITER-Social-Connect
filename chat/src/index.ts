import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({port: 5000});

let userCount = 0;
let allSockets: WebSocket[] = [];

wss.on("connection", (socket) => {
  allSockets.push(socket);

  userCount += 1;
  console.log("User connected #", userCount);

  socket.on("message", (message) => {
    console.log("message received " + message.toString())
    for(let i=0; i<allSockets.length; i++){
      const s = allSockets[i];
      s.send(message.toString() + ": sent from the server")
    }
  })
})



