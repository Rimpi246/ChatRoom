const path = require('path');
const http = require('http');
const express = require('express');
const socket = require("socket.io");
const bodyParser = require("body-parser");
const Filter = require("bad-words");

var app = express();
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");

app.use(require('cors')());

const server = http.createServer(app);

//Socket setup
var io = socket(server);

//Static files
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/chat", (req, res) => {
  res.sendFile(__dirname + "/public/chat.html");
});



const botName = "🤖Bot";

io.on('connection', socket => {

  socket.on("joinRoom", ({
    username,
    room
  }) => {

    //Add the user to the room
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatRoom"));

    //Broadcast when a user connects
    socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} has joined the room`));

    //Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  });


  //Listen for chatMessage
  socket.on("chatMessage", (inputMessage) => {
    const user = getCurrentUser(socket.id);

    const filter = new Filter();
    if(filter.isProfane(inputMessage)){
      socket.emit("message", formatMessage(botName, "Profanity is not allowed"));
    }
    else{
      io.to(user.room).emit("message", formatMessage(user.username, inputMessage));
    }
  })

  // Listen for typing
  socket.on("typing", username => {
    const user = getCurrentUser(socket.id);
    socket.broadcast.to(user.room).emit("typing", username);
  })

  socket.on("disconnect", function() {
    const user = userLeave(socket.id);

    if(user){
       io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the room`));

       //Send users and room info
       io.to(user.room).emit("roomUsers", {
         room: user.room,
         users: getRoomUsers(user.room)
       });
    }

  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("Server started at " + (port));
});
