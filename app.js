const XClient = require('beam-client-node');
const XSocket = require('beam-client-node/lib/ws');
const Carina = require('carina').Carina;
const ws = require('ws');
Carina.WebSocket = ws;
const ca = new Carina({ isBot: true }).open();
const channelId = 6772196;
let fs = require("fs");
let userInfo;
let qSet = new Set();
const client = new XClient();
let jokes;
// With OAuth we don't need to login, the OAuth Provider will attach
// the required information to all of our requests after this call.
client.use('oauth', {
    tokens: {
        access: 'kn7IfCBlsHASvATqRwhkap2y82cpKO2nSNBVMBl5ww5XfCb2KjlNDEGdgFR2vGe0',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
});

// Get's the user we have access to with the token
client.request('GET', `users/current`)
    .then(response => {
        userInfo = response.body;
        //before: response.userInfo.channelId
        //now: hardcoded xboxinterns channelId
        return client.chat.join(channelId)
    })
    .then(response => {
        const body = response.body;
        //channel id has to be xboxinterns - hardcoded
        return createChatSocket(userInfo.id, channelId, body.endpoints, body.authkey)
    })
    .catch(error => {
        console.log('Something went wrong:', error)
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

    ca.subscribe(`channel:${channelId}:followed`, data => {
        socket.call('msg', [`@${data.user.username} followed!`]);
        console.log(data);
    });

    // Greet a joined user
    socket.on('UserJoin', data => {
        socket.call('msg', [`Hi ${data.username}! I'm pingbot! Write !ping and I will pong back!`])
    });

    // React to our !pong command
    socket.on('ChatMessage', data => {
        // input is an array of the strings given by user, seperated by spaces
        let input = data.message.message[0].data.split(' ');
        let opt = input[0].toLowerCase();
        // console.log(input[0]);
        if (opt === '!ping') {
            socket.call('msg', [`@${data.user_name} PONG!`]);
            console.log(`Ponged ${data.user_name}`)
        }
        if(opt === '!what') {
            socket.call('msg', ['Hey! We\'re three Xbox Interns - Andy, Dani, and Tanvi! We\'re new to Mixer and to PUBG. Check !rules to see what the rules of our chat are :) and !commandlist to see InternXBot\'s list of commands!'])
        }
        if(opt === '!rules') {
            socket.call('msg', ['1. Be nice \n2. No profanity \n3. If you don\'t follow 1 & 2 we can fire you (ban you) from the stream. \n4. Be chill fam'])
        }

        if(opt === '!commandlist') {
            socket.call('msg', ['Here\'s a list of my current commands: !what, !rules, !twitter, !ping, !dadjoke, !spin - Check back for more!'])
        }
        if(opt === '!twitter') {
            socket.call('msg',['Follow the interns on twitter: twitter.com/xboxinterns Follow our bots at twitter.com/MixerInternBot !'])
        }

        if (opt === '!spin' && isNaN(input[1])) {
            socket.call('msg', [`@${data.user_name} please enter a valid number`])
        }

        if (opt === '!spin' && !isNaN(input[1])) {
            // result = a number between -input[1] and +input[1]
            if (Math.random() > Math.random()) {
                let winnings = (Math.random() *  parseInt(input[1])) + parseInt(input[1]);
                socket.call('msg', [`@${data.user_name} won ${Math.round(winnings)} points!`]);
            } else {
                socket.call('msg', [`@${data.user_name} lost the spin...`])
            }
        }

        if(opt === '!coinflip') {
            // socket.call('msg', [`@${data.user_name} flips a coin...`])
            if (Math.random() > 0.5) {
                socket.call('msg', [`@${data.user_name} flips a coin... The result of the coin flip is: HEADS!`])
            } else {
                socket.call('msg', [`@${data.user_name} flips a coin... The result of the coin flip is: TAILS!`])
            }
        }

        if(opt === '!dieroll') {
            //socket.call('msg', [`@${data.user_name} rolls a die...`])
            let n = Math.floor(Math.random() * 6) + 1;
            if (n === 1) {
                socket.call('msg', [`@${data.user_name} rolls a die... The result of the die roll is: 1`])
            } else if(n === 2) {
                socket.call('msg', [`@${data.user_name} rolls a die... The result of the die roll is: 2`])
            }
            else if(n === 3) {
                socket.call('msg', [`@${data.user_name} rolls a die... The result of the die roll is: 3`])
            }
            else if(n === 4) {
                socket.call('msg', [`@${data.user_name} rolls a die... The result of the die roll is: 4`])
            }
            else if(n === 5) {
                socket.call('msg', [`@${data.user_name} rolls a die... The result of the die roll is: 5`])
            }
            else if(n === 6) {
                socket.call('msg', [`@${data.user_name} rolls a die... The result of the die roll is: 6`])
            }

        }

        if(opt === '!dadjoke') {
            if (!jokes) {
                jokes = generateArray('./dadjokes.txt');
                socket.call('msg', [`@${data.user_name} ${randomLine(jokes)}`])
            } else {
                socket.call('msg', [`@${data.user_name} ${randomLine(jokes)}`])
            }
        }

        if(opt === '!q') {
            // below pushes the entire message including the '!q'
            qSet.add(data.message.message[0].data);
            getQuestions(); // !!! delete this since it'll repeatedly print the questions
        }
    });

    // Handle errors
    socket.on('error', error => {
        console.error('Socket error', error)
    });

    return socket.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Login successful')
            return socket.call('msg', ['Hi! I\'m InterXBot, Write !commandlist to see my full list of commands!'])
        })
}

function generateArray(fileName) {
    return fs.readFileSync(fileName).toString().split('\n');
}

function randomLine(arr) {
    let length = arr.length;
    line = arr[Math.floor(Math.random() * length)];
    return line;
}

function getQuestions() {
    for(let i of qSet) {
        console.log(i);
    }
}
