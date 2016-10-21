'use strict;'
//Include crypto to generate the movie id
var crypto = require('crypto');

module.exports = function() {
    return {
        deviceList : [],
        appList: [],
        /*
         * Save the device inside the "db".
         */
        save(device) {
            device.id = crypto.randomBytes(20).toString('hex'); // fast enough for our purpose
            this.deviceList.push(device);
            return 1;           
        },
        saveApp(id, app) {
            deviceapp = {};
            deviceapp.id = crypto.randomBytes(20).toString('hex');
            deviceapp.device_id = id;
            deviceapp.app = app
            this.appList.push(deviceapp);
            return 1;
        },
        /*
         * Retrieve a device apps with a given device id or return all the devices if the id is undefined.
         */
        find(id) {
            if(id) {
                return this.appList.find(element => {
                        return element.device_id === id;
                    }); 
            }else {
                return this.deviceList;
            }
        },
        /*
         * Delete a specific app in the device with the given id.
         */
        remove(id) {
            var found = 0;
            this.appList = this.appList.filter(element => {
                    if(element.device_id === id) {
                        found = 1;
                    }else {
                        return element.device_id !== id;
                    }
                });
            return found;           
        },
        /*
         * Update a app in the device with the given id
         */
        update(id, app) {
            var appIndex = this.appList.findIndex(element => {
                return element.device_id === id;
            });
            if(appIndex !== -1) {
                this.appList[appIndex].app = app
                return 1;
            }else {
                return 0;
            }
        }       
    }
};