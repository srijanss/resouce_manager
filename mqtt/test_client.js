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

// client.conn.on('connect', function() {
// 	var topic_options = ['register'];
// 	var topic = client.create_topic(topic_options);
// 	var payload = {"message" : client.conn.options.clientId};
// 	console.log('Published ', topic, payload);
// 	client.publish(topic, payload);
// 	topic_options.push(client.conn.options.clientId);
// 	console.log(topic_options);
// 	console.log('Subscribed ', client.create_topic(topic_options));
// 	client.subscribe(client.create_topic(topic_options));
// 	client.conn.on('message', (topic, message) => {
// 		console.log(JSON.parse(message).message);
// 	});
// });