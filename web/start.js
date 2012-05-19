var webServer = require('./app'),
    SocketServer = require('../connections/connections-server'),
    port = process.env.PORT || 5001,
    socketServer = new SocketServer();


webServer.listen(port);
socketServer.start( webServer );
