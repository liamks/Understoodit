(function(){

  var _this;
  SocketModule = function(){
    this.addHandlers();
    _this = this;
    this.initialized = false;
    this.connectionAttempts = 0;
  };


  SocketModule.prototype.isMobile = function(){
    var agent = navigator.userAgent;

    return /iPad|iPhone|Android|webOS|mobile|BlackBerry|PlayBook/.test(agent);
  }

  SocketModule.prototype.addHandlers = function(){

    app.events.on('connect-info', this.connect);
    app.events.on('understood', this.understood);
    app.events.on('confused', this.confused);
    app.events.on('send-settings', this.sendSettings);
  };

  SocketModule.prototype.sendSettings = function(newSettings){
    newSettings.action = 'settings';
    newSettings.teacherID = _this.info.teacherID;
    _this.socket.emit('message', newSettings );
  };

  SocketModule.prototype.connect = function(info){
    _this.info = info;
    _this.socket = io.connect(info.socketURL);
    _this.addSocketHandlers();
  };

  SocketModule.prototype.socketConnnected = function(){
    _this.info.screenName = location.pathname.substr(1);
    console.log('Socket Connected (init).');
    _this.socket.emit('init', _this.info);
    this.connectionAttempts = 0;
  };


  SocketModule.prototype.socketInitialized = function(){
    if(!_this.initialized){
      var obj = {
        loggedIn : _this.info.loggedIn,
        isTeacher : _this.info.studentID === undefined,
        isMobile : _this.isMobile()
      }
      console.log('Socket Initialized (initialized)')
      app.events.trigger('initialized', obj);
    }
    _this.initialized = true;
  }

  SocketModule.prototype.socketInitializedFailed = function(){
    if( $('#loading').length !== 0 ){
      $('#loading div')
        .text( "Connection Error, try again later. ")
        .css({'color' : 'red'})
    }
  }

  SocketModule.prototype.socketReconnecting = function(){
    if(_this.connectionAttempts > 5 ){
      app.events.trigger('notification', {
        message: "Understoodit has been disconnected. Please check your internet connection.",
        classTag : 'error',
        duration : 6000
      });

      app.events.trigger('socket-disconnect', '');
      _this.connectionAttempts = 0;
    }
    _this.connectionAttempts += 1;

  }

  SocketModule.prototype.connectFailed = function(){
    if( $('#loading').length !== 0 ){
      $('#loading div')
        .text( "Could not connect! Could you try again later?")
        .css({'color' : 'red'})
    }else{
      console.error('failed!!!')
    }
  }

  SocketModule.prototype.addSocketHandlers = function(){
    this.socket.on('connect', this.socketConnnected);
    this.socket.on('initialized', this.socketInitialized);
    this.socket.on('initialized-fail', this.socketInitializedFailed );
    this.socket.on('message', this.messageReceived);
    this.socket.on('reconnecting', this.socketReconnecting )
    this.socket.on('error', this.connectFailed );
  };


  SocketModule.prototype.messageReceived = function(message){
    var action = message.action.replace(" ","-");
    app.events.trigger(action, message);
  };

  SocketModule.prototype.understood = function(){
    _this.socket.emit('message', {action:'understood', studentID : _this.info.studentID });
  };

  SocketModule.prototype.confused = function(){
    _this.socket.emit('message', {action:'confused', studentID : _this.info.studentID });
  }

  new SocketModule();
}).call(this);