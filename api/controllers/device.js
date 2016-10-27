'use strict';
    // Include our "db"
    var db = require('../../config/db')();
    // Exports all the functions to perform on the db
    module.exports = {getdevices, register, getdevice, saveapp, updateapp, deleteapp};
    // module.exports = {getdevices, register, getdevice, getapp, saveapp, updateapp, deleteapp};

    //GET /device operationId
    function getdevices(req, res, next) {
      res.json({ devices: db.find()});
    }
    //POST /device operationId
    function register(req, res, next) {
        res.json({success: db.save(req.body), description: "Device added to the list!"});
    }
    //GET /device/{id} operationId
    // Get device info based on device id provided 
    function getdevice(req, res, next) {
        var id = req.swagger.params.id.value; //req.swagger contains the path parameters
        var device = db.find(id);
        if(device) {
            device.app = db.findapp(id);
            console.log(device);
            res.json({device: device});
        }else {
            res.status(204).send();
        }       
    }
    //POST /device/{id} operatoinId
    // post applications installed in the device
    function saveapp(req, res, next) {
        var id = req.swagger.params.id.value;
        res.json({success: db.saveApp(id, req.body), description: "Application added to the list"});
    }
    //PUT /device/{id}/{app_id} operationId
    // update specific application in the device
    function updateapp(req, res, next) {
        var id = req.swagger.params.id.value; //req.swagger contains the path parameters
        // req.body [{id:id, name:name, version:version}]
        var app_id = req.swagger.params.app_id.value;
        if(db.update(id, app_id, req.body)){
            res.json({success: 1, description: "Device app updated!"});
        }else{
            res.status(204).send();
        }

    }
    //DELETE /device/{id}/{app_id} operationId
    // delete specific application in the device
    function deleteapp(req, res, next) {
        var id = req.swagger.params.id.value; //req.swagger contains the path parameters
        var app_id = req.swagger.params.app_id.value;
        if(db.remove(id, app_id)){
            res.json({success: 1, description: "Device app deleted!"});
        } else {
            res.status(204).send();
        }

    }