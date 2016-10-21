'use strict';
    // Include our "db"
    var db = require('../../config/db')();
    // Exports all the functions to perform on the db
    module.exports = {getdevices, register, getapp, saveapp, updateapp, deleteapp};

    //GET /device operationId
    function getdevices(req, res, next) {
      res.json({ devices: db.find()});
    }
    //POST /device operationId
    function register(req, res, next) {
        res.json({success: db.save(req.body), description: "Device added to the list!"});
    }
    //GET /device/{id} operationId
    function getapp(req, res, next) {
        var id = req.swagger.params.id.value; //req.swagger contains the path parameters
        var deviceapp = db.find(id);
        if(deviceapp) {
            res.json(deviceapp);
        }else {
            res.status(204).send();
        }       
    }
    //POST /device/{id} operatoinId
    function saveapp(req, res, next) {
        var id = req.swagger.params.id.value;
        res.json({success: db.saveApp(id, req.body), description: "Application added to the list"});
    }
    // TODO : Update specific application based on application ID
    //PUT /device/{id} operationId
    function updateapp(req, res, next) {
        var id = req.swagger.params.id.value; //req.swagger contains the path parameters
        // req.body [{id:id, name:name, version:version}]
        if(db.update(id, req.body)){
            res.json({success: 1, description: "Device app updated!"});
        }else{
            res.status(204).send();
        }

    }
    // TODO : Delete specific application based on application ID
    //DELETE /device/{id} operationId
    function deleteapp(req, res, next) {
        var id = req.swagger.params.id.value; //req.swagger contains the path parameters
        if(db.remove(id)){
            res.json({success: 1, description: "Device app deleted!"});
        }else{
            res.status(204).send();
        }

    }