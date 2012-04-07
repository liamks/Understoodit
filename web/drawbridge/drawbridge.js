var bcrypt = require('bcrypt');
var crypto = require('crypto');
var querystring = require('querystring');
var reservedKeywords = require('./reservedKeywords').keywords;

var postMarkAPIKEY = '57c81312-8357-4f70-a2dc-983929166c79'
var postmark = require('postmark')(postMarkAPIKEY);

var drawbridge = {};



User = function(){
  this.db = require('./adapters/riak');
}


User.prototype.authenticate = function(email, password, cb){
  var _this = this;
  this.findByEmail(email, function(err, data, meta){
    if(err){
      cb('error',null);
    }else{
      var screenName = data[0];
      _this.find(screenName ,function(err,data){
        if(err){
          cb('error',null);
        }else{
          if(bcrypt.compareSync(password, data.password)){
            data.screenName = screenName;
            data.email = email;
            _this.data = data;
            cb(null, data);
          }else{
            cb('error', null);
          }
        }
      });
    }
  });
}


User.prototype.create = function(options, cb){
  var salt = bcrypt.genSaltSync(10);
  options.password = bcrypt.hashSync(options.password, salt);
  this.db.create(options, cb);
}

User.prototype.find = function(screenName, cb){
  this.db.find(screenName, cb);
}

User.prototype.findByEmail = function(email, cb){
  var _this = this;
  this.db.findByEmail(email, function(err,data,meta){
    _this.data = data;
    _this.screenName = data[0];
    cb(err,data,meta);
  });
}

User.prototype.resetPassword = function(email, ip){
  var starter = Math.random().toString() + 'a bear' + Date.now().toString() + 'cat';

  var options = {
    resetLink: crypto.createHash('sha256').update(starter).digest('hex'),
    resetTime : Date.now(),
    resetIP : ip
  };

  this.db.save(this.screenName, options, function(err,data){
     //send email
     var query = querystring.stringify({ token : options.resetLink, email : email});
     var link = 'http://understoodit.com/resetPassword?' +  query;
     postmark.send({
      "From" : 'accounts@understoodit.com',
      "To" : email, 
      "Subject" : "Password Reset",
      "TextBody" : link
     }, function(err, data){
        if(err){
          console.log(err);
        }
     })
  })
}


drawbridge.up = function(app){
  drawbridge.drawBridge = new DrawBridge(app)
}

DrawBridge = function(app){
  this.app = app;
  this.makeRoutes();

}

DrawBridge.prototype.login = function(req, res){
  if(req.session.user && req.session.user.loggedIn){
    res.redirect('/' + req.session.user.screenName );
  }else{
    options = {
      title : "Login"
    };
    res.render('drawbridge/login', options);
  }
}

DrawBridge.prototype.processLogin = function(req, res){
  var options = {title:'Login'}
  var email = req.param('email', '');
  var password = req.param('password','');
  var user = new User()
  if(email === '' || password == ''){
    options.errors = ['Email and password must not be blank'];
    res.render('drawbridge/login', options);
  }else{
    user.authenticate(email, password, function(err,data){
      if(user.data){
        /* success! */
        req.session.user = user;
        req.session.user.loggedIn = true;
        req.session.user.email = email;
        res.redirect('/' + user.data.screenName );
      }else{
        /* password and email do not match =( */
        options.errors = ['Email and password do not match'];
        res.render('drawbridge/login', options);
      }
    });
  }
}

DrawBridge.prototype.logout = function(req, res){
  delete req.session.user;
  res.redirect('/login');
}

DrawBridge.prototype.register = function(req, res){
  options = {
    title : 'Register',
    screenName: '',
    email: '',
    password: '',
    confirmPassword: '',
    errors : []
  };

  res.render('drawbridge/register', options);
}

DrawBridge.prototype.validateRegistration = function(req){
  options = {
    title : 'Register',
    screenName: req.param('screenName', ''),
    email : req.param('email',''),
    password: req.param('password', ''),
    confirmPassword  : req.param('confirmPassword', ''),
    errors : []
  };

  if(options.screenName === ''){
    options.errors.push('Screen Name cannot be blank');
  }else if(reservedKeywords[options.screenName] === ''){
    options.errors.push('That Screen Name is unavaible');
  };

  if(options.email === ''){
    options.errors.push('Email cannot be blank');
  };

  if(options.password === '' || options.password !== options.confirmPassword){
    options.errors.push('Passwords do not match');
    options.password = '';
    options.confirmPassword = '';
  };

  return options;
}

DrawBridge.prototype.createUser = function(options, error, succ){
  user = new User()

  options.settings = {
    studentsCanSeeComprehension : false
  };

  user.find(options.screenName, function(err, data){

    if(!err.notFound){
      /* Screen Name already taken */
      options.errors.push('Sorry, ' + options.screenName + ' is already taken.');
      error(options);

    }else{
      /* Screen Name not taken */
      user.findByEmail(options.email, function(err, data){

        if(data.length !== 0){

          /* email already taken */
          options.errors.push('Sorry, that email is already registered at understoodit');
          error(options);

        }else{
          /* Email and screen name are NOT taken */


          user.create(options, function(er, data){
            if(er){
    
              /* Database errors */
              options.errors.push('We are having technical difficulties, sorry!');
              error(options);
            }else{
              /* Success, a new users has been created! */
              succ();
            }
          })
        }
      })
    }
  })
}

DrawBridge.prototype.processRegister = function(req, res){

  var options = this.validateRegistration(req);
  var user;
  var success = '/' + options.screenName; 

  var error = function(opt){
    res.render('drawbridge/register', opt);
  };

  var succ = function(){
    res.redirect(success);
  }

  if(options.errors.length > 0){
    error();
  }else{
    options.settings = {
      studentsCanSeeComprehension : false
    };
    this.createUser(options, error, succ);
  }
}

/* Reset for when the forget their password */
DrawBridge.prototype.reset = function(req, res){
  var options = { title: 'Reset Password' , success: false, errors : []};
  res.render('drawbridge/reset', options);
};

DrawBridge.prototype.processReset = function(req, res){
  var email = req.param('email', '');
  var options = { title : 'Reset Password' , success: false};
  var user;

  if(email === ''){
    options.errors = ["Email must not be blank!"];
    res.render('drawbridge/reset', options);
  }else{
    user = new User();
    user.findByEmail(email, function(err, data){
      if(data.length === 0){
        /* NO MATCH */
        options.errors = ["That email does not match any on understoodit"];
      }else if(data.length !== 0){
        /* MATCH */
        var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
        user.resetPassword(email, ip);
        options.success = true;
      }else{
        /* Technical error */
        options.errors = ["We are experience some technical difficulties, sorry!!!"];
      }


      res.render('drawbridge/reset', options);

    })
  }
};

DrawBridge.prototype.makeRoutes = function(){
 

  this.app.get('/login', this.login.bind(this));

  this.app.post('/login', this.processLogin.bind(this));

  this.app.get('/logout', this.logout.bind(this));

  this.app.get('/register', this.register.bind(this));
  this.app.post('/register', this.processRegister.bind(this));

  this.app.get('/reset', this.reset.bind(this));
  this.app.post('/reset', this.processReset.bind(this));


};

module.exports = drawbridge;
