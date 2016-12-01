'use strict';

var mqttclient = require('./client');

var client = new mqttclient();

client.timer();

// Connect to the broker
client.connect();

var device = {
	location: 'vaajakatu',
	device_type: ['temperature']
};
// Register with RR
client.register(device);

client.install_app('installapp');
client.install_app('updateapp');
client.delete_app();
