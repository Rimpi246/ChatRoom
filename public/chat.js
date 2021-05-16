
//Query DOM
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const inputMessage = document.getElementById("inputMessage");

//Get username and room from URL(try to change this)
const { username, room} = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

console.log(username, room);

//Join ChatRoom
socket.emit("joinRoom", { username, room});

//Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
})



//Catch Message from server
socket.on("message", message =>{
  outputMessage(message);
  feedback.innerHTML = "";

  //Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
})

//Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  //Get message text
  const inputMessage = e.target.elements.inputMessage.value;

  //Emit message to server
  socket.emit("chatMessage", inputMessage);

  //Clear input
   e.target.elements.inputMessage.value = "";
   e.target.elements.inputMessage.focus();
})


//Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML =`<p class="meta"> <strong>${message.username}</strong> <span> ${message.time} </span></p>
  <p class="text"> ${message.text} </p>`
  document.querySelector(".chat-messages").appendChild(div);

}

//Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

//Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
   ${users.map(user => `<li> <i class="fa fa-user-circle-o" aria-hidden="true"> ${user.username} </i></li>` ).join('')}
  `;
}

//
inputMessage.addEventListener("keydown", function() {
  socket.emit("typing", username);
})

socket.on("typing", (data) => {
 feedback.innerHTML=`<p><em>${data} is typing...</em></p>`;
});
