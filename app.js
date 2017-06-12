const XClient = require('beam-client-node');
const XSocket = require('beam-client-node/lib/ws');

let userInfo;

const client = new XClient();

// With OAuth we don't need to login, the OAuth Provider will attach
// the required information to all of our requests after this call.
client.use('oauth', {
    tokens: {
        access: 'kn7IfCBlsHASvATqRwhkap2y82cpKO2nSNBVMBl5ww5XfCb2KjlNDEGdgFR2vGe0',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
});

// Get's the user we have access to with the token
//my dudes does this work
client.request('GET', `users/current`)
    .then(response => {
        userInfo = response.body;
        //before: response.userInfo.channelId
        //now: hardcoded xboxinterns channelId
        return client.chat.join(6725743);
    })
    .then(response => {
        const body = response.body;
        //channel id has to be xboxinterns - hardcoded
        return createChatSocket(userInfo.id, 6725743, body.endpoints, body.authkey);
    })
    .catch(error => {
        console.log('Something went wrong:', error);
    });

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
    const socket = new XSocket(endpoints).boot();

    // Greet a joined user
    socket.on('UserJoin', data => {
        socket.call('msg', [`Hi ${data.username}! I'm pingbot! Write !ping and I will pong back!`]);
    });

    // React to our !pong command
    socket.on('ChatMessage', data => {
        // input is an array of the strings given by user, seperated by spaces
        var input = data.message.message[0].data.split(" ");
       // console.log(input[0]);
        if (input[0] == '!ping') {
            socket.call('msg', [`@${data.user_name} PONG!`]);
            console.log(`Ponged ${data.user_name}`);
        }

      if (input[0] == '!spin' && isNaN(input[1])) {
        socket.call('msg', [`@${data.user_name} please enter a valid number`]);
      }

       if (input[0] == '!spin' && !isNaN(input[1])) {
        // result = a number between -input[1] and +input[1]
        if (Math.random() > Math.random()) {
            console.log(input[1]);
            var winnings = (Math.random() *  parseInt(input[1])) + parseInt(input[1]);
            socket.call('msg', [`@${data.user_name} won ${Math.round(winnings)} points!`]);
        } else {
            socket.call('msg', [`@${data.user_name} lost the spin...`]);
        }
      }


    });



    // Handle errors
    socket.on('error', error => {
        console.error('Socket error', error);
    });

    return socket.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Login successful');
            return socket.call('msg', ['Hi! I\'m pingbot! Write !ping and I will pong back!']);
        });
}

