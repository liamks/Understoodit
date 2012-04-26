
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , drawbridge = require('drawbridge')
  , RedisStore = require('connect-redis')(express)
  , uuid = require('node-uuid');


var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'hasUMdfasdurwqfasfdee35fr5 2347#$%><' , store: new RedisStore}));
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  //app.use(express.favicon(__dirname + '/public/favicon.ico',  { maxAge: 2592000000 }));

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});



//Setup drawbridge.js
drawbridge = drawbridge.up( app );
drawbridge.afterLogin(function( response, user ){
  response.redirect( '/' + user.screenName );
});

routes.drawbridge = drawbridge

// Routes
app.get('/', routes.index);
app.get('/contact/', routes.contact );
app.get('/blog/', routes.blog );
app.get('/blog/:articleID/', routes.blogArticle );


app.get('/info', [ routes.getTeacher, routes.getSettings ], routes.info);

app.post('/:screenName/settings', [ routes.saveSettingsSetup ] ,routes.saveSettings );
app.get('/:screenName', routes.understoodit );



app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
