// Generated by CoffeeScript 1.3.1

var Connection, ConnectionsServer, http, io;

http = require('http');
io = require('socket.io');
Connection = require('./connection').connection;

function ConnectionsServer() {
  this.teachers = require('../config/teachers.json');
  this.connections = {};
}

ConnectionsServer.prototype.start = function( webServer ) {
  var _this = this;

  this.io = io.listen( webServer );
  this.io.configure('test', function() {
    return _this.io.set('log level', 0);
  });
  this.io.configure('production', function() {
    _this.io.set('log level', 1);
    return _this.io.set('close timeout', 10);
  });
  return this.io.on('connection', function(socket) {
    var connection;
    connection = new Connection(socket);
    if ((connection != null) && !(_this.connections[socket.id] != null)) {
      _this.connections[socket.id] = connection;
      return socket.on('disconnect', function() {
        if (_this.connections[socket.id] != null) {
          _this.connections[socket.id].disconnect();
          return delete _this.connections[socket.id];
        }
      });
    }
  });
};

ConnectionsServer.prototype.stop = function() {
  return this.io.server.close();
};



module.exports = ConnectionsServer;


