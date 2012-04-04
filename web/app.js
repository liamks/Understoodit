
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , drawbridge = require('./drawbridge/drawbridge')
  , RedisStore = require('connect-redis')(express)
  , uuid = require('node-uuid');


var app = module.exports = express.createServer(
  express.favicon()
);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'hasdfasdfasfdee35fr5 2347#$%><' , store: new RedisStore}));
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});



//Setup drawbridge.js
drawbridge.up(app);

// Routes
app.get('/', routes.index);

// App
var getUser = function(req, res, next){
  var screenName = req.params.screenName
  var user = { teacherID : screenName }
  if(req.session.user){
  
    //Logged in
    if( screenName === req.session.user.screenName ){
      // Logged in and teacher

    }else{
      // Logged in but not the teacher
      user.studentID = req.session.user.screenName;
    }
    
  }else{
    var newID = uuid.v4();
    req.session.user = { screenName : newID , loggedIn : false };
    user.studentID = newID;
    user.loggedIn = false;
  }

  req.user = user;
  next();
}

app.get('/info', getUser, routes.info);

// temporary
app.post('/signup', routes.signup);


var reserved = ["ws", "signup", "info", "login", "logout", "register"]

app.get('/:screenName', routes.understoodit );



app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
