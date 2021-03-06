'use strict;'
//Include crypto to generate the device and app id for http case
var crypto = require('crypto');

module.exports = function() {
    return {
        deviceList : [],
        appList: [],
        /*
         * Save the device inside the "db".
         */
        save(device, create_id) {
            if(create_id){
                device.id = 'device_' + crypto.randomBytes(10).toString('hex'); // fast enough for our purpose
            }
            this.deviceList.push(device);
            return device.id;           
        },
        saveApp(id, app, appID) {
            var created_appID;
            app.forEach(element =>{
                if(appID === undefined){
                    // element.id = 'app_' + crypto.randomBytes(10).toString('hex');
                    created_appID = element.id;
                } else {
                    element.id = appID;
                }
                element.device_id = id;
                this.appList.push(element);
            });
            if(appID === undefined) {
                return created_appID;
            } else {
                return appID;
            }
        },
        /*
         * Retrieve a device apps with a given device id or return all the devices if the id is undefined.
         */
        find(id) {
            if(id) {
                return this.deviceList.find(element => {
                        return element.id === id;
                    }); 
            }else {
                return this.deviceList;
            }
        },
        findapp(id) {
            if(id) {
                return this.appList.filter(element => {
                    return element.device_id === id; 
                });
            }
        },
        /*
         * Delete a specific app in the device with the given id.
         */
        remove(id, app_id) {
            var found = 0;
            this.appList = this.appList.filter(element => {
                    if(element.id === app_id && element.device_id === id) {
                        found = 1;
                    }else {
                        return element.id !== app_id;
                    }
                });
            return found;           
        },
        /*
         * Update a app in the device with the given id
         */
        update(id, app_id, app) {
            var appIndex = this.appList.findIndex(element => {
                return (element.device_id === id && element.id === app_id);
            });
            if(appIndex !== -1) {
                this.appList[appIndex].image = app[0].image;
                this.appList[appIndex].version = app[0].version;
                return 1;
            }else {
                return 0;
            }
        }       
    }
};