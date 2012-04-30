
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , drawbridge = require('drawbridge')
  , RedisStore = require('connect-redis')(express)
  , uuid = require('node-uuid')
  , redis = require('redis').createClient()
  , fs = require('fs')
  , notFound404 = fs.readFileSync(__dirname + '/public/404.html', 'utf8')
  , port = process.env.PORT || 5001;


var app = module.exports = express.createServer();



toCache = [
  '/javascripts/app.min.js',
  '/javascripts/front.min.js',
  '/stylesheets/app.css',
  '/stylesheets/style.css'
];

cache = {};

(function setupCache(){
  var root = __dirname + '/public'

  for (var i = toCache.length - 1; i >= 0; i--) {
    cache[toCache[i]] = {
      'min': fs.readFileSync( root + toCache[i] ),
      'gz' : fs.readFileSync( root + toCache[i] + '.gz' )
    }
  };
})();


function staticCaching( req, res, next ){

  var url = req.url,
      encoding, ext;

  if( /(js|css)$/.test( url ) ){
 
    if(cache[url] !== undefined){
      encoding = req.header('accept-encoding');
     
      if( /gzip/.test(encoding) ){

        // Cache-Control: max-age=300
        res.header('Accept-Encoding','Vary')
        ext = url.match(/(js|css)/);
        if(ext[0] === 'js'){
          res.header('Content-Type', 'application/javascript')
        }else{
          res.header('Content-Type', 'text/css')
        }
        //get ending and set
        
        res.header('Content-Encoding', 'gzip');
        res.send( cache[url]['gz'] )
      }else{

        //does not except gzip
        res.send( cache[url]['min'] )
      }
      
    }else{
      // not in the cache
      next();
    }
    
  }else{
    // not js or css
    next();
  }
}


// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'hasUMdfasdurwqfasfdee35fr5 2347#$%><' , store: new RedisStore}));
  app.use(require('stylus').middleware({ src: __dirname + '/public',compress :true }));
  app.use(app.router);
  
  //app.use(gzippo.staticGzip(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public/favicon.ico',  { maxAge: 2592000000 }));

});

app.configure('development', function(){

  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(staticCaching)
  app.use(express.static(__dirname + '/public'));
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

app.post('/:screenName/settings', [ routes.saveSettingsSetup ], routes.saveSettings );

// We should first check that the person exists

checkIfUserExists = function( req, res, next ){
  redis.hexists('screenNames', req.params.screenName, function(error, result){
    if(error || !result){
      res.send( notFound404, 404 );
    }else{
      next()
    }
  })
}

app.get('/:screenName', [ checkIfUserExists ], routes.understoodit );




app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
