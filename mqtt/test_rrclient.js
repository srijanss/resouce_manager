'use strict';

var mqttclient = require('./client');

var client = new mqttclient({
	host: '127.0.0.1',
	port: 1883,
	device_type: 'RR'
});

// Connect to the broker
client.connect();

// Handle Registration Request
client.register();

// Handle Getdevices Request
client.getdevices();

// Handle Getdevice request for individual device
client.getdevice();

// Add application to Device
client.saveapp();

// Update application in the Device
client.updateapp();
