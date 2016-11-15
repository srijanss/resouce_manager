'use strict';

const Args = require('command-line-args');
var mqttclient = require('./client');

const optionsDefinitions = [
	{ name: 'listdevices', type: Boolean },
	{ name: 'listapps', type: Boolean },
	{ name: 'install', alias: 'i', type: Boolean },
	{ name: 'update', alias: 'u', type: Boolean },
	{ name: 'remove', alias: 'r', type: Boolean },
	{ name: 'deviceid', type: String },
	{ name: 'appid', type: String },
	{ name: 'applist', type: String },
];

const options = Args(optionsDefinitions);

var client = new mqttclient({
	host: '127.0.0.1',
	port: 1883,
	device_type: 'TTY'
});

client.timer();

// Connect to the broker
client.connect();

// Get list of registered devices
if(options.listdevices){
	client.getdevices();
}

// Get the specific device details
if(options.listapps){
	client.getdevice(options.deviceid);
}

// Add application to the device
if(options.install){
 	client.saveapp(options.deviceid, options.applist);
}

// Update application in the device
if(options.update){
	client.updateapp(options.deviceid, options.appid, options.applist);	
}

// Delete application from the device
if(options.remove){
	client.deleteapp(options.deviceid, options.appid);
}

// client.conn.end();

