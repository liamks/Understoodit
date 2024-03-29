// Generated by CoffeeScript 1.3.1

var Connection, ConnectionsServer, http, io;

http = require('http');
io = require('socket.io');
Connection = require('./connection').connection;

function ConnectionsServer() {
  this.teachers = require('../config/teachers.json');
}

ConnectionsServer.prototype.start = function( webServer ) {
  var _this = this;

  this.io = io.listen( webServer );
  this.io.configure('test', function() {
    return _this.io.set('log level', 0);
  });
  this.io.configure('production', function() {
    _this.io.set( 'log level', 1 );
    _this.io.set( 'browser client', false );
    _this.io.set( 'transports', ["xhr-polling"] );
    _this.io.set( 'polling duration' );
  });
  
  this.io.on('connection', function(socket) {
    var connection = new Connection(socket);

    socket.on('disconnect', function() {
      connection.disconnect();
    });
  });
};

ConnectionsServer.prototype.stop = function() {
  return this.io.server.close();
};



module.exports = ConnectionsServer;


