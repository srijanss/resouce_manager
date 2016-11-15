'use strict';

/*
	Module Dependencies
*/

var fs = require('fs');
var events = require('events');
var mqtt = require('mqtt');
var inherits = require('inherits');
var db = require('../config/db')();


var defaultOptions = {
	host: '127.0.0.1',
	port: 1883,
	device_type: 'IOT'
};


/* 
	Mqtt Client constructor
*/

function Client(options) {
	if(!options) {
		this.options = defaultOptions;
	} else {
		this.options = options;
	}
	
	this.HOST = this.options.host;
	this.PORT = this.options.port.toString();	
	this.DEVICE_TYPE = this.options.device_type;
	this.TOPIC = "";
	this.TOPIC_OPTS = [];

	this.BROKER_URL = 'tcp://' + this.HOST + ':' + this.PORT;
}
inherits(Client, events.EventEmitter);

/** 
	@api private
**/

Client.prototype.connect = function() {
	this.conn = mqtt.connect(this.BROKER_URL);
};

Client.prototype.create_topic = function(topic_options) {
	var topic = "";
	topic_options.forEach(element => {
		topic += element + '/';
	})
	return topic;
};

Client.prototype.subscribe = function(topic) {
	this.conn.subscribe(topic);
	
};

Client.prototype.publish = function(topic, payload) {
	this.conn.publish(topic, JSON.stringify(payload));
};

// getdevices, register, getdevice, saveapp, updateapp, deleteapp
Client.prototype.getdevices = function() {
	var that = this;
	if(this.DEVICE_TYPE === 'TTY'){
		var topic_options = ['getdevices', 'handshake'];
		var tty_topic = this.create_topic(topic_options);
		this.publish(tty_topic, {'status': true});
		topic_options.pop();
		tty_topic = this.create_topic(topic_options);
		this.subscribe(tty_topic);
		this.conn.on('message', (topic, message) => {
			if(topic === tty_topic) {
				message = JSON.parse(message);
				console.log(message);
				that.emit('log_time');
			}
		});
	} else if(this.DEVICE_TYPE === 'RR') {
		var topic_options = ['getdevices', 'handshake'];
		var rr_topic = this.create_topic(topic_options);
		this.subscribe(rr_topic);
		topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === rr_topic) {
				if(JSON.parse(message).status) {
					var payload = db.find();
					// console.log(payload);
					that.publish(that.create_topic(topic_options), JSON.stringify(payload));
				}
			}
		});
	}
};

Client.prototype.register = function(device) {
	var that = this;
	this.TOPIC_OPTS = ['register'];
	this.TOPIC = this.create_topic(this.TOPIC_OPTS);
	if(this.DEVICE_TYPE === 'IOT') { // Registration request from device
		this.conn.on('connect', function() {
			var payload = {"message" : that.conn.options.clientId, "device": device};
			// console.log('Published ', topic, payload);
			that.publish(that.TOPIC, payload);
			that.TOPIC_OPTS.push(this.options.clientId);
			// console.log('Subscribed ', that.create_topic(topic_options));
			that.TOPIC = that.create_topic(that.TOPIC_OPTS);
			that.subscribe(that.TOPIC);
			this.on('message', (topic, message) => {
				// console.log(JSON.parse(message).message);
				if(topic === that.TOPIC) {
					that.emit('log_time');
				}
			});	
		});
	} else if (this.DEVICE_TYPE === 'RR') { // Registration part done in RR
		this.conn.on('connect', function() {
			// console.log('Subscribed ', topic);
			that.subscribe(that.create_topic(that.TOPIC_OPTS));
			this.on('message', (topic, message) => {
				if(topic === that.TOPIC) {
					console.log('Registering new device');
					message = JSON.parse(message);
					that.TOPIC_OPTS.push(message.message);
					// console.log(message.device);
					db.save(message.device);
					that.DEVICE_REGISTERED = true;
					var payload = {"message" : "registration success"};
					console.log('Published ', that.create_topic(that.TOPIC_OPTS), payload)
					that.publish(that.create_topic(that.TOPIC_OPTS), payload);
					that.TOPIC_OPTS.pop();	
				}
			});
		});
	}
};

Client.prototype.getdevice = function(deviceID) {
	var that = this;
	if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = ['getdevice', 'handshake'];
		var tty_topic = this.create_topic(topic_options);
		this.publish(tty_topic, {'status': true, 'deviceID':deviceID});
		topic_options.pop();
		topic_options.push(deviceID);
		tty_topic = this.create_topic(topic_options);
		// console.log(tty_topic);
		this.subscribe(tty_topic);
		this.conn.on('message', (topic, message) => {
			// console.log(topic, tty_topic);
			if(topic === tty_topic) {
				message = JSON.parse(message);
				console.log(message);
				that.emit('log_time');
			}
		});
	} else if(this.DEVICE_TYPE === 'RR') {
		var topic_options = ['getdevice', 'handshake'];
		var rr_topic = this.create_topic(topic_options);
		this.subscribe(rr_topic);
		topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === rr_topic) {
				if(JSON.parse(message).status) {
					var deviceID = JSON.parse(message).deviceID;
					topic_options.push(deviceID);
					var payload = db.find(deviceID);
					if(payload){
						payload.app = db.findapp(deviceID);
						// console.log(payload);
						that.publish(that.create_topic(topic_options), JSON.stringify(payload));
					} else {
						that.publish(that.create_topic(topic_options), {status:'error', message:'Device not Found'});
					}
					topic_options.pop();
				}
			}
		});
	}

};
Client.prototype.saveapp = function(deviceID, applist) {
	var that = this;
	if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = ['saveapp', 'handshake'];
		var tty_topic = this.create_topic(topic_options);
		var apps;
		fs.readFile(applist,  (err, data) => {
			if(err) {
				throw err;
			}
			apps = JSON.parse(data);
			this.publish(tty_topic, {'status': true, 'deviceID':deviceID, 'applist':apps});
			topic_options.pop();
			topic_options.push(deviceID);
			tty_topic = this.create_topic(topic_options);
			this.subscribe(tty_topic);
			this.conn.on('message', (topic, message) => {
				if(topic === tty_topic) {
					message = JSON.parse(message);
					console.log(message);
					that.emit('log_time');
				}
			});
		});
	} else if(this.DEVICE_TYPE === 'RR') {
		var topic_options = ['saveapp', 'handshake'];
		var rr_topic = this.create_topic(topic_options);
		this.subscribe(rr_topic);
		topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === rr_topic) {
				if(JSON.parse(message).status) {
					var deviceID = JSON.parse(message).deviceID;
					var applist = JSON.parse(message).applist;
					topic_options.push(deviceID);
					if(db.find(deviceID)){
						if(db.saveApp(deviceID, applist)) {
							that.publish(that.create_topic(topic_options), 
								JSON.stringify({status: 'success', message: 'Application Added to the device'}));
						} else {
							that.publish(that.create_topic(topic_options), 
								JSON.stringify({status: 'error', message: 'Error Adding Application'}));
						}
					} else {
						that.publish(that.create_topic(topic_options), 
							JSON.stringify({status: 'error', message: 'Device Not Found'}));
					// console.log(payload);
					}
					topic_options.pop();
				}
			}
		});
	}	
};
Client.prototype.updateapp = function(deviceID, appID, applist) {
	var that = this;
	if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = ['udpateapp', 'handshake'];
		var tty_topic = this.create_topic(topic_options);
		var apps;
		fs.readFile(applist,  (err, data) => {
			if(err) {
				throw err;
			}
			apps = JSON.parse(data);
			this.publish(tty_topic, {'status': true, 'deviceID':deviceID, 'appID':appID, 'applist':apps});
			topic_options.pop();
			topic_options.push(deviceID);
			topic_options.push(appID);
			tty_topic = this.create_topic(topic_options);
			// console.log(tty_topic);
			this.subscribe(tty_topic);
			this.conn.on('message', (topic, message) => {
				// console.log(topic, tty_topic);
				if(topic === tty_topic) {
					message = JSON.parse(message);
					console.log(message);
					that.emit('log_time');
				}
			});
		});
	} else if(this.DEVICE_TYPE === 'RR') {
		var topic_options = ['udpateapp', 'handshake'];
		var rr_topic = this.create_topic(topic_options);
		this.subscribe(rr_topic);
		topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === rr_topic) {
				if(JSON.parse(message).status) {
					var deviceID = JSON.parse(message).deviceID;
					var appID = JSON.parse(message).appID;
					var applist = JSON.parse(message).applist;
					topic_options.push(deviceID);
					topic_options.push(appID);
					var device = db.find(deviceID);
					// console.log(applist);
					if(device){
						if(db.update(deviceID, appID, applist)){
							// console.log(that.create_topic(topic_options));
							that.publish(that.create_topic(topic_options), {status:'success', message:'Application Updated'});
						} else {
							that.publish(that.create_topic(topic_options), {status:'error', message:'Error Updating Application'});
						}
						// console.log(payload);
					} else {
						that.publish(that.create_topic(topic_options), {status:'error', message:'Device not Found'});
					}
					topic_options.pop();
					topic_options.pop();
				}
			}
		});
	}

};
Client.prototype.deleteapp = function() {};

// Timer api to log time
Client.prototype.timer = function() {
	this.time = process.hrtime();
	this.on('log_time', () =>{
		var time_diff = process.hrtime(this.time);
		console.log('Time taken = ' + time_diff[0] + time_diff[1]/1e9 + ' seconds');
	});
};


module.exports = Client;



// Client.prototype.register_newdevice = function() {
// 	var topic, payload, options;
// 	var that = this;
// 	if(this.DEVICE_TYPE === 'IOT') {
// 		options = ['register', 'newdevice'];
// 		payload = {
// 				location : this.DEVICE_LOCATION,
// 				type : this.DEVICE_TYPE,
// 				id : this.DEVICE_ID
// 			}
// 		topic = createTopic(options);
// 		this.conn.publish(topic, JSON.stringify(payload));
// 	} else {
// 		options = ['register', 'newdevice'];
// 		topic = createTopic(options);
// 		this.conn.subscribe(topic);
// 		this.conn.on('message', function(topic, message) {
// 			//console.log(message.toString());
// 			that.emit('register_success');
// 		});
// 	}
// };

// LiquidMqttClient.prototype.list_device = function() {
// 	nop();
// };

// LiquidMqttClient.prototype.describe_device = function() {
// 	nop();
// };
