/**
 * Created by t-anpark on 6/13/2017.
 */
// const Carina = require('carina').Carina;
// const ws = require('ws');
// Carina.WebSocket = ws;
//
// const channelId = 6772196;
//
// const ca = new Carina({ isBot: true }).open();
// ca.subscribe(`channel:${channelId}:update`, data => {
//   ca.call('msg', ['juiasdf']);
//   console.log(data);
// });
const Carina = require('carina').Carina;
const ws = require('ws');
Carina.WebSocket = ws;

const channelId = 6772196;

const ca = new Carina({ isBot: true }).open();

const XClient = require('beam-client-node')
const XSocket = require('beam-client-node/lib/ws')
var fs = require('fs');
let userInfo
var qSet = new Set();
const client = new XClient()
var jokes;
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


    ca.subscribe(`channel:${channelId}:update`, data => {
      socket.call('msg', [`@${data.user_name} followed!`])
      console.log(data);
    });
  // Handle errors
  socket.on('error', error => {
    console.error('Socket error', error)
  })

  return socket.auth(channelId, userId, authkey)
    .then(() => {
      console.log('Login successful')
      return socket.call('msg', ['Hi! I\'m InterXBot, Write !commandlist to see my full list of commands!'])
    })
}
