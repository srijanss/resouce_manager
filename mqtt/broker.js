'use strict';

var mosca = require('mosca');

var pubsubsettings = {
    type : 'mongo',
    url : 'mongodb://localhost:27017/mqtt',
    pubsubCollection : 'ascoltatori',
    mongo : {}
};

var moscaSettings = {
    port : 1883,
    backend : pubsubsettings
};

var server = new mosca.Server(moscaSettings);

server.on('clientConnected', function(client) {
    console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
    console.log('Client Connected', packet.payload);
});

server.on('ready', function setup() {
    console.log('Mosca server is up and running');
});
