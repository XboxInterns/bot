/**
 * Created by t-anpark on 6/13/2017.
 */
const Carina = require('carina').Carina;
const ws = require('ws');
Carina.WebSocket = ws;

const channelId = 6772196;

const ca = new Carina({ isBot: true }).open();
ca.subscribe(`channel:${channelId}:update`, data => {

  console.log(data);
});

