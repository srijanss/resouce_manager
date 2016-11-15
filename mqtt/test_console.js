'use strict';

var mqttclient = require('./client');

var client = new mqttclient({
	host: '127.0.0.1',
	port: 1883,
	device_type: 'TTY'
});

client.timer();

// Connect to the broker
client.connect();

// Get list of registered devices
client.getdevices();

// Get the specific device details
if(process.argv.length > 2){
	client.getdevice(process.argv[2]);
	if(process.argv.length > 3) {
	client.saveapp(process.argv[2], process.argv[3]);
}
}

