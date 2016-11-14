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
client.getdevices();

// client.conn.on('connect', function() {
// 	var topic_options = ['register'];
// 	var topic = client.create_topic(topic_options);
// 	console.log('Subscribed ', topic);
// 	client.subscribe(client.create_topic(topic_options));
// 	client.conn.on('message', (topic, message) => {
// 		message = JSON.parse(message);
// 		topic_options.push(message.message);
// 		// console.log(topic_options);
// 		var payload = {"message" : "success"};
// 		console.log('Published ', client.create_topic(topic_options), payload)
// 		client.publish(client.create_topic(topic_options), payload);
// 	});
// });