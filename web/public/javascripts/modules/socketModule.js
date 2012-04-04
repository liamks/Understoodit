$(function(){
  var _this;
  SocketModule = function(){
    this.addHandlers();
    _this = this;
  };

  SocketModule.prototype.addHandlers = function(){
    app.events.on('connect-info', this.connect);
  };

  SocketModule.prototype.connect = function(info){
    _this.info = info;
    _this.socket = io.connect(info.socketURL);
    _this.addSocketHandlers();
  };

  SocketModule.prototype.socketConnnected = function(){
    _this.info.screenName = location.pathname.substr(1);
    _this.socket.emit('init', _this.info);
  };


  SocketModule.prototype.socketInitialized = function(){
    console.log('socket has initialized!!!!')
  }

  SocketModule.prototype.addSocketHandlers = function(){
    this.socket.on('connect', this.socketConnnected);
    this.socket.on('initialized', this.socketInitialized);
    this.socket.on('message', this.messageReceived);
  };


  SocketModule.prototype.messageReceived = function(message){
    console.log(message);
  };


  new SocketModule();
});