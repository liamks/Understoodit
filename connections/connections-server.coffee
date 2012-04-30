# modules
http      = require 'http'
io        = require 'socket.io'


Connection = require('./connection').connection


class ConnectionsServer
  constructor: () ->
    # config
    @teachers  = require '../config/teachers.json'
    @port      = process.env.PORT || 5000
    @connections = {}

  start: () ->

    @app = http.createServer()
    @app.listen @port
    @io = io.listen @app

    @io.configure 'test', () =>
      @io.set 'log level', 0
      #@io.set 'close timeout', 2


    @io.configure 'production', () =>
      @io.set 'log level', 1
      @io.set 'close timeout', 5
      @io.set 'browser client', false

    @io.on 'connection', (socket) =>

      connection = new Connection socket

      if connection? and not @connections[socket.id]?
        @connections[socket.id] = connection
        socket.on 'disconnect', () =>
         
          if @connections[socket.id]?
 
            @connections[socket.id].disconnect()
            delete @connections[socket.id]

  stop: () ->
    @io.server.close()


exports.connections = ConnectionsServer




