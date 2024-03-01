
const socket = io();


const clientsTotal = document.getElementById('client-total')
const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const room = document.getElementById('private-message')

const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')
const messageTone = new Audio('/message-tone.mp3')


// const messageCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('message='));
// const messageObject = JSON.parse(messageCookie.split('=')[1]);
// console.log(messageObject); // This will log 'incorrect email or password'

 const messageCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('message='));
if (messageCookie) {
  const encodedValue = messageCookie.split('=')[1];
  const decodedValue = decodeURIComponent(encodedValue);
  const messageObject = JSON.parse(decodedValue);
  console.log(messageObject);
  nameInput.innerText = messageObject.name;
} else {
  console.log('No message cookie found');
}

// socket.onAny((event, ...args) => {
//   console.log(event, args);
// });
const chatterName = nameInput.innerText


messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  sendMessage()
})

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`
})

function sendMessage() {
  if (messageInput.value === '') return
  // console.log(messageInput.value)
  const data = {
    name: nameInput.innerText,
    message: messageInput.value,
    dateTime: new Date(),
  }
  const receiver = room.value;
  socket.emit('message', data , receiver)
  addMessageToUI(true, data)
  messageInput.value = ''
}

socket.on('chat-message', (data) => {
  // console.log(data)
  messageTone.play()
  addMessageToUI(false, data)
})

// function addMessageToUI(isOwnMessage, data) {
//   clearFeedback()
//   const element = `
//       <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
//           <p class="message">
//             ${data.message}
//             <span>${data.name} ● ${moment(data.dateTime).fromNow()}</span>
//           </p>
//         </li>
//         `

//   messageContainer.innerHTML += element
//   scrollToBottom()
// }

function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  const messageDate = new Date(data.dateTime);
  const formattedDate = formatMessageDate(messageDate);

  const element = `
    <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
      <p class="message">
        ${data.message}
        <span>${data.name} ● ${formattedDate}</span>
      </p>
    </li>
  `;

  messageContainer.innerHTML += element;
  scrollToBottom();
}

function formatMessageDate(date) {
  const options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}


function formatMessageDate(date) {
  const options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

messageInput.addEventListener('focus', (e) => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.innerText} is typing a message`,
  })
})

messageInput.addEventListener('keypress', (e) => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.innerText} is typing a message`,
  })
})
messageInput.addEventListener('blur', (e) => {
  socket.emit('feedback', {
    feedback: '',
  })
})

socket.on('feedback', (data) => {
  clearFeedback()
  const element = `
        <li class="message-feedback">
          <p class="feedback" id="feedback">${data.feedback}</p>
        </li>
  `
  messageContainer.innerHTML += element
})

function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((element) => {
    element.parentNode.removeChild(element)
  })
}

window.onload = async () => {
  const nameInput = document.getElementById('name-input')

    try {


      // nameInput.innerText = `${user.name}`
      
    } catch (error) {
      
    }
};



