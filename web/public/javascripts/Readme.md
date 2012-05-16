

main.js contains the initialization code for the client-side application.


1. main.js makes an ajax request to /info?screenName=
2. when the ajax request completes it triggers the 'connect-info' event
3. The socketModule.js listens for the 'connect-info' event, and when it hears it, it triggers it  does `_socket.emit('init', _this.info )`
4. When the socket.io server has received the 'init' event, and setup the user, it sends an 'initialized' event back to the client.
5. The initialized event, removes the 'loading...' div and triggers 'loading-done'
6. 'loading-done' in turn triggers the parentView to load.
7. When the parentView has loaded it triggers 'parentView-loaded', and all its child elements can load.