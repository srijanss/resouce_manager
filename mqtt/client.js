'use strict';

/*
	Module Dependencies
*/

var fs = require('fs');
var events = require('events');
var mqtt = require('mqtt');
var inherits = require('inherits');
var db = require('../config/db')();

var DockerCommand = require('../../device/scripts/dockercommand');
var dockercmd = new DockerCommand();


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
			var payload = {"deviceID" : that.conn.options.clientId, "device": device};
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
					that.TOPIC_OPTS.push(message.deviceID);
					// console.log(message.device);
					message.device['id'] = message.deviceID;
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

// Save App Details that is Installed in Device to RR
Client.prototype.saveapp_details = function(deviceID, applist, appid) {
	var that = this;
	if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = ['saveapp', 'handshake'];
		var tty_topic = this.create_topic(topic_options);
		this.publish(tty_topic, {'status': true, 'deviceID':deviceID, 'applist':applist, 'appID':appid});
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
		// var apps;
		// fs.readFile(applist,  (err, data) => {
		// 	if(err) {
		// 		throw err;
		// 	}
		// 	apps = JSON.parse(data);
		// 	this.publish(tty_topic, {'status': true, 'deviceID':deviceID, 'applist':apps});
		// 	topic_options.pop();
		// 	topic_options.push(deviceID);
		// 	tty_topic = this.create_topic(topic_options);
		// 	this.subscribe(tty_topic);
		// 	this.conn.on('message', (topic, message) => {
		// 		if(topic === tty_topic) {
		// 			message = JSON.parse(message);
		// 			console.log(message);
		// 			that.emit('log_time');
		// 		}
		// 	});
		// });
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
					var apps = JSON.parse(message).applist;
					var appID = JSON.parse(message).appID;
					topic_options.push(deviceID);
					if(db.find(deviceID)){
						if(db.saveApp(deviceID, apps, appID) !== "204") {
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

// Update App Details that is Updated in Device to RR
Client.prototype.updateapp_details = function(deviceID, appID, applist) {
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

// Delete App Details that is Removed from Device to RR
Client.prototype.deleteapp_details = function(deviceID, appID) {
	var that = this;
	if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = ['deleteapp', 'handshake'];
		var tty_topic = this.create_topic(topic_options);
		this.publish(tty_topic, {'status': true, 'deviceID':deviceID, 'appID':appID});
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
	} else if(this.DEVICE_TYPE === 'RR') {
		var topic_options = ['deleteapp', 'handshake'];
		var rr_topic = this.create_topic(topic_options);
		this.subscribe(rr_topic);
		topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === rr_topic) {
				if(JSON.parse(message).status) {
					var deviceID = JSON.parse(message).deviceID;
					var appID = JSON.parse(message).appID;
					topic_options.push(deviceID);
					topic_options.push(appID);
					var device = db.find(deviceID);
					// console.log(applist);
					if(device){
						if(db.remove(deviceID, appID)){
							// console.log(that.create_topic(topic_options));
							that.publish(that.create_topic(topic_options), {status:'success', message:'Application Deleted'});
						} else {
							that.publish(that.create_topic(topic_options), {status:'error', message:'Error Deleting Application'});
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

// Install or Update Application in IOT Device
Client.prototype.install_app = function(topicheader, clientId, applist) {
	var that = this;
	if(this.DEVICE_TYPE === 'IOT') {
		var topic_options = [topicheader, that.conn.options.clientId];
		var iot_topic = this.create_topic(topic_options);
		this.subscribe(iot_topic);
		console.log('Subscribed to topic ' + iot_topic);
		// topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === iot_topic) {
				console.log(' Message received from Published install option');
				var applist = JSON.parse(message).applist;
				applist.forEach(app =>{
					dockercmd.run(app.name, '10011:10010');
					dockercmd.once('imagerunning', () => {
						dockercmd.imageID(app.name);
						dockercmd.once('gotimageID', () => {
							// res.json({'imageid': dockercmd.IMAGEID, 'status': 'Image Running'});
							console.log({'imageid': dockercmd.IMAGEID, 'status': 'Image Running'});
							topic_options.push('getimageid');
							that.publish(that.create_topic(topic_options), {'imageid':dockercmd.IMAGEID});
							topic_options.pop();
						});
					});
				});
			}
		});
	} else if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = [topicheader, clientId];
		var tty_topic = this.create_topic(topic_options);
		fs.readFile(applist,  (err, data) => {
			if(err) {
				throw err;
			}
			var apps = JSON.parse(data);
			this.publish(tty_topic, {'applist':apps});
			// topic_options.pop();
			topic_options.push('getimageid');
			tty_topic = this.create_topic(topic_options);
			this.subscribe(tty_topic);
			this.conn.on('message', (topic, message) => {
				if(topic === tty_topic) {
					message = JSON.parse(message);
					// console.log(message);
					// applist.appid = message.imageid;
					that.saveapp_details(clientId, apps, message.imageid);
					// that.emit('log_time');
				}
			});
		});
	}
};

// // Update Application in IOT Device
// Client.prototype.update_app = function() {

// };

// Delete Application in IOT Device
Client.prototype.delete_app = function(clientId, imageID) {
	var that = this;
	if(this.DEVICE_TYPE === 'IOT') {
		var topic_options = ['deleteapp', that.conn.options.clientId];
		var iot_topic = this.create_topic(topic_options);
		this.subscribe(iot_topic);
		// topic_options.pop();
		this.conn.on('message', (topic, message) => {
			// console.log(JSON.parse(message).status);
			if(topic === iot_topic) {
				var appID = JSON.parse(message).appID;
				console.log('Image to remove ' + appID);
				dockercmd.remove_container(appID);
				var containerremove_handler;
				var imageremove_handler;
				var nocontainer_handler;
				var noimage_handler;
				dockercmd.once('containerremoved', containerremove_handler = function (){
					dockercmd.remove_image(appID);
					console.log("IMAGE : " + appID);
					dockercmd.removeListener('nocontainer', nocontainer_handler);
				});
				dockercmd.once('imageremoved', imageremove_handler = function (){
					// res.json({'success': 1, 'description': 'Image removed successfully'});
					console.log({'success': 1, 'description': 'Image removed successfully'});
					topic_options.push('imagedeleted');
					that.publish(that.create_topic(topic_options), {'status':'success', 'message': 'Application Image Deleted'});
					topic_options.pop();
					// console.log('Restart iot-device after removal');
					dockercmd.removeListener('noimage', noimage_handler);
				});	
				dockercmd.once('nocontainer', nocontainer_handler = function (){
					console.log("NOCONTAINER : " + appID);
					// res.json({'success': 1, 'description': 'Image doesnot exists'});
					console.log({'success': 1, 'description': 'Image doesnot exists'});
					topic_options.push('imagedeleted');
					that.publish(that.create_topic(topic_options), {'status':'error', 'message': 'Image doesnot exists'});
					topic_options.pop();
					dockercmd.removeListener('containerremoved', containerremove_handler);
					dockercmd.removeListener('noimage', noimage_handler);
					dockercmd.removeListener('imageremoved', imageremove_handler);
				});
				dockercmd.once('noimage', noimage_handler = function (){
					// res.json({'success': 1, 'description': 'Image doesnot exists'});
					console.log({'success': 1, 'description': 'Image doesnot exists'});
					topic_options.push('imagedeleted');
					that.publish(that.create_topic(topic_options), {'status':'error', 'message': 'Image doesnot exists'});
					topic_options.pop();
					dockercmd.removeListener('containerremoved', containerremove_handler);
					dockercmd.removeListener('imageremoved', imageremove_handler);
					dockercmd.removeListener('nocontainer', nocontainer_handler);
				});	
			}
		});
	} else if(this.DEVICE_TYPE === 'TTY') {
		var topic_options = ['deleteapp', clientId];
		var tty_topic = this.create_topic(topic_options);
		this.publish(tty_topic, {'appID':imageID});
		// topic_options.pop();
		topic_options.push('imagedeleted');
		tty_topic = this.create_topic(topic_options);
		this.subscribe(tty_topic);
		this.conn.on('message', (topic, message) => {
			if(topic === tty_topic) {
				message = JSON.parse(message);
				// console.log(message);
				// that.emit('log_time');
				that.deleteapp_details(clientId, imageID);
			}
		});
	}
};

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
