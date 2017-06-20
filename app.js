const XClient = require('beam-client-node');
const XSocket = require('beam-client-node/lib/ws');
const Carina = require('carina').Carina;
const ws = require('ws');
Carina.WebSocket = ws;
const ca = new Carina({isBot: true}).open();
const channelId = 6772196;
let fs = require('fs');
let userInfo;
let qSet = new Set();
const client = new XClient();
let jokes;
let commands;
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
        return client.chat.join(channelId);
    })
    .then(response => {
        const body = response.body;
        //channel id has to be xboxinterns - hardcoded
        return createChatSocket(userInfo.id, channelId, body.endpoints, body.authkey)
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
function createChatSocket(userId, channelId, endpoints, authkey) {
    // Chat connection
    const socket = new XSocket(endpoints).boot();

    ca.subscribe(`channel:${channelId}:followed`, data => {
        if (data.following) {
            socket.call('msg', [`@${data.user.username} followed!`]);
        }
    });

    ca.subscribe(`channel:${channelId}:hosted`, data => {
        socket.call('msg', [`@${data.user.username} began hosting our channel! Thanks!`]);
    });

    ca.subscribe(`channel:${channelId}:subscribed`, data => {
        socket.call('msg', [`@${data.user.username} subscribed!`]);
    });

    // Greet a joined user
    // socket.on('UserJoin', data => {
    //     socket.call('msg', [`@${data.username} has joined the stream!`])
    // });

    // React to our !pong command
    socket.on('ChatMessage', data => {
        // input is an array of the strings given by user, seperated by spaces
        let input = data.message.message[0].data.split(' ');
        let opt = input[0].toLowerCase();

        if (!commands) {
            commands = {
                '!dadjoke': 'dadjoke',
                '!spin': 'spin',
                '!dieroll': 'dieroll',
                '!coinflip': 'coinflip',
                '!q': 'q',
                '!create': 'create'
            };
            generateCommandsMap('./commands.txt');
        }

        let ret;
        switch (opt) {
            case '!create':
                if (input[1] && input[2]) {
                    let str = data.message.message[0].data.split(input[1]).pop();
                    // for (var i = 2; i < input.length; i++) {
                    //     str += input[i];
                    //     if (i !== input.length - 1) {
                    //         str += " ";
                    //     }
                    // }
                    if ((data.user_roles.includes('Mod') || data.user_roles.includes('Owner')) && !commands[input[1]]) {
                        if (input[1].substr(0,1) !== '!') {
                          input[1] = '!' + input[1];
                        }
                      commands[input[1]] = str;
                        fs.appendFile('./commands.txt', `\r${input[1]}+${str}`, function (err) {
                            if (err) return console.log(err);
                        })
                      ret = 'your command ' + input[1] + ' was created!';
                    }
                }
                break;
            case '!spin':
                if (isNaN(input[1])) {
                    ret = 'please enter a valid number';
                } else {
                    if (Math.random() > Math.random()) {
                        let winnings = Math.round((Math.random() * parseInt(input[1])) + parseInt(input[1]));
                        ret = 'won ' + winnings + ' points!';
                    } else {
                        ret = 'lost the spin...';
                    }
                }
                break;
            case '!coinflip':
                if (input[1] && (input[1].toLowerCase() !== 'heads' || input[1].toLowerCase() !== 'tails')) {
                    if (Math.random() > 0.5) {
                        ret = 'HEADS!';
                    } else {
                        ret = 'TAILS!';
                    }
                    ret = 'flips a coin... The result of the coin flip is: ' + ret;
                } else {
                    ret = 'please enter "heads" or "tails"';
                }
                break;
            case '!dieroll':
                ret = 'rolls a die... The result of the die roll is: ' + (Math.floor(Math.random() * 6) + 1);
                break;
            case '!dadjoke':
                if (!jokes) {
                    jokes = generateArray('./dadjokes.txt');
                }
                ret = randomLine(jokes);
                break;
            case '!q':
                // below pushes the entire message including the '!q'
                qSet.add(data.message.message[0].data);
                // getQuestions() // !!! delete this since it'll repeatedly print the questions
                break;
            default:
                if (commands[opt]) {
                    socket.call('msg', [commands[opt]]);
                }
                break;

        }
        if (ret) {
            socket.call('msg', [`@${data.user_name} ${ret}`]);
        }

    });

    // Handle errors
    socket.on('error', error => {
        console.error('Socket error', error);
    });

    return socket.auth(channelId, userId, authkey)
        .then(() => {
            console.log('Login successful');
            return socket.call('msg', ['Hi! I\'m InternXBot, Write !commandlist to see my full list of commands!']);
        })
}

function generateArray(fileName) {
    return fs.readFileSync(fileName).toString().split('\n');
}

function generateCommandsMap(fileName) {
    fs.readFileSync(fileName).toString().split('\r').forEach(function (line) {
        let temp = line.split('=');
        commands[temp[0]] = temp[1];
    });
    console.log(commands);
}

function randomLine(arr) {
    let length = arr.length;
    line = arr[Math.floor(Math.random() * length)];
    return line;
}

function getQuestions() {
    for (let i of qSet) {
        console.log(i);
    }
}

