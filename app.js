const XClient = require('beam-client-node')
const XSocket = require('beam-client-node/lib/ws')
var fs = require('fs');
let userInfo
var qSet = new Set();
const client = new XClient()
var jokes;
generateArray('./dadjoke');
// With OAuth we don't need to login, the OAuth Provider will attach
// the required information to all of our requests after this call.
client.use('oauth', {
  tokens: {
    access: 'kn7IfCBlsHASvATqRwhkap2y82cpKO2nSNBVMBl5ww5XfCb2KjlNDEGdgFR2vGe0',
    expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
  },
})

// Get's the user we have access to with the token
client.request('GET', `users/current`)
  .then(response => {
    userInfo = response.body
    //before: response.userInfo.channelId
    //now: hardcoded xboxinterns channelId
    return client.chat.join(6772196)
  })
  .then(response => {
    const body = response.body
    //channel id has to be xboxinterns - hardcoded
    return createChatSocket(userInfo.id, 6772196, body.endpoints, body.authkey)
  })
  .catch(error => {
    console.log('Something went wrong:', error)
  })

/**
 * Creates a beam chat socket and sets up listeners to various chat events.
 * @param {number} userId The user to authenticate as
 * @param {number} channelId The channel id to join
 * @param {any} endpoints An endpoints array from a beam.chat.join call.
 * @param {any} authkey An authentication key from a beam.chat.join call.
 * @returns {Promise.<>}
 */
function createChatSocket (userId, channelId, endpoints, authkey) {
  // Chat connection
  const socket = new XSocket(endpoints).boot()

  // Greet a joined user
  socket.on('UserJoin', data => {
    socket.call('msg', [`Hi ${data.username}! I'm pingbot! Write !ping and I will pong back!`])
  })

  // React to our !pong command
  socket.on('ChatMessage', data => {

    // input is an array of the strings given by user, seperated by spaces
    var input = data.message.message[0].data.split(' ')
    // console.log(input[0]);
    if (input[0] == '!ping') {
      socket.call('msg', [`@${data.user_name} PONG!`])
      console.log(`Ponged ${data.user_name}`)
    }
    if(input[0] == '!what') {
      socket.call('msg', ['Hey! We\'re three Xbox Interns - Andy, Dani, and Tanvi! We\'re new to Mixer and to PUBG. Check !rules to see what the rules of our chat are :) and !commandlist to see InternXBot\'s list of commands!'])
    }
      if(input[0] == '!rules') {
          socket.call('msg', ['1. Be nice \n2. No profanity \n3. If you don\'t follow 1 & 2 we can fire you (ban you) from the stream. \n4. Be chill fam'])
      }

      if(input[0] == '!commandlist') {
       socket.call('msg', ['Here\'s a list of my current commands: !what, !rules, !twitter, !ping, !dadjoke, !spin - Check back for more!'])
      }
      if(input[0] == '!twitter') {
          socket.call('msg',['Follow the interns on twitter: twitter.com/xboxinterns Follow our bots at twitter.com/MixerInternBot !'])
      }

    if (input[0] == '!spin' && isNaN(input[1])) {
      socket.call('msg', [`@${data.user_name} please enter a valid number`])
    }

    if (input[0] == '!spin' && !isNaN(input[1])) {
      // result = a number between -input[1] and +input[1]
      if (Math.random() > 0) {          // 50/50 chance of winning
        socket.call('msg', [`@${data.user_name} won ${input[1]} points!`])
      } else {
        socket.call('msg', [`@${data.user_name} lost...`])
      }
    }

    if(input[0] == '!dadjoke') {
      socket.call('msg', [`@${data.user_name} ${randomLine(jokes)}`])
    }

    if(input[0] == '!q') {
      // below pushes the entire message including the '!q'
      qSet.add(data.message.message[0].data);
      getQuestions(); // !!! delete this since it'll repeatedly print the questions
    }
  })

  // Handle errors
  socket.on('error', error => {
    console.error('Socket error', error)
  })

  return socket.auth(channelId, userId, authkey)
    .then(() => {
      console.log('Login successful')
      return socket.call('msg', ['Hi! I\'m pingbot! Write !ping and I will pong back!'])
    })
}

function generateArray(fileName) {
  fs.readFile(fileName, function(err, data) {
    if (err) throw err;
    data += ' '
    jokes = data.split('\n')
  })
}

function randomLine(arr) {
    line = arr[Math.floor(Math.random()*arr.length)];
    return line;
}

function getQuestions() {
  for(let i of qSet) {
    console.log(i);
  }
}
