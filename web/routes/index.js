var app = require('../app'),
    _this = this,
    _ = require('underscore')._,
    redis = require('redis').createClient(),
    crypto = require('crypto');


var tokenB = 'kwtpIq1N8/Sp6cYxEvpoQ1sG09FtodXjUb9aW+ahoM0=',
    tokenBTeacher = 'ml5qmczfz6yovJJXr0L0BEO3Av7jMfanrggteFuwMxo=',
    isProduction = process.env.NODE_ENV === 'production';


var getTokens = function(tokenB){
  var data = Date.now().toString() + Math.random().toString();
  var tokenA = crypto.createHash('sha256').update( data ).digest('base64');

  return {
    tokenA : tokenA,
    tokenC : crypto.createHash('sha256').update( tokenA + tokenB ).digest('base64') 
  };
};


/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { production: isProduction })
};


exports.contact = function(req, res){
  res.render('siteTemplate/contact', { production: isProduction, title:'understoodit - Contact' })
}


exports.getTeacher = function(req, res, next){
  var options = { screenName : req.query.screenName };
  _this.drawbridge.getUser( options, function( error, teacher ){

    if( teacher && teacher.screenName ){
      req.teacher = teacher;
      next();
    }else{
      res.json({ error : 'Teacher not found' }, 404);
    }

  });
}


exports.getSettings = function(req, res, next){
  if( req.teacher.settings_studentsCanSeeComprehension !== undefined ){
    req.teacherSettings = {
      studentsCanSeeComprehension : req.teacher.settings_studentsCanSeeComprehension === "true",
      buttonTimeout : req.teacher.settings_buttonTimeout || "10"
    };
    next();
  }else{
    redis.multi()
      .hmset( req.teacher.email, {
        'settings_studentsCanSeeComprehension': true,
        'settings_buttonTimeout' : "10"
      })
      .exec(function( err, result ){
        req.teacherSettings = {
          studentsCanSeeComprehension : true,
          buttonTimeout : "10"
        };
        next();
      });
  }
}


exports.info = function(req, res){
  var user = _this.drawbridge.currentUser( req ),
      teacherID = req.teacher.screenName,
      studentID,
      options,
      tokens, profile;

  if( user && user.screenName === teacherID ){
    tokens = getTokens( tokenBTeacher );

    profile = {
      fullname : user.fullname,
      organizationType : user.organizationType,
      organizationName : user.organizationName,
      organizationSubject  : user.organizationSubject 
    };

  }else{
    tokens = getTokens( tokenB );
    studentID = user ? user.screenName : req.cookies["connect.sid"];
  }

  options = {
    socketURL : (process.env.NODE_ENV === 'production') ? 'http://understoodit.com/' : 'http://0.0.0.0:5001/',
    loggedIn  : user !== undefined,
    teacherID : teacherID,
    studentID : studentID,
    tokenA    : tokens.tokenA,
    tokenC    : tokens.tokenC,
    settings  : req.teacherSettings,
    email     : user ? user.email : '',
    profile : profile
  }

  res.json( options );
}



/*
 * POST save settings
 */

exports.saveSettingsSetup = function(req, res, next){
  var setup = {
    currentUser : _this.drawbridge.currentUser( req ),
    screenName : req.params.screenName
  };

  if( setup.currentUser && setup.currentUser.screenName === setup.screenName ){
    req.setup = setup;
    next();
  }else{
    res.json('', 404);
  }
}

exports.saveSettings = function(req, res){
  var currentUser = req.setup.currentUser,
      screenName = req.setup.screenName,
      multi = redis.multi(),
      settings = {
        studentsCanSeeComprehension : req.param('studentsCanSeeComprehension') == 'true',
        buttonTimeout : req.param('buttonTimeout')
      },
      keys = _.keys( settings );
    
  for (var i = keys.length - 1; i >= 0; i--) {
    multi.hset( currentUser.email, "settings_" + keys[i], settings[keys[i]] );
  };

  multi.exec(function( error, response ){

    if( error ){
      res.json( 'Error', 500 );
    }else{
      res.json('success');
    }

  });
}


/*
 * GET understoodit application
 */
exports.understoodit = function(req, res){
  var options = { 
    environment: process.env.NODE_ENV 
  };

  if(options.environment === 'development'){
    options.jsIncludes = require('../public/javascripts/app.json');
  }

  res.render('app/index', options);
};


exports.saveProfileSetup = function( req, res, next ){
  var setup = {
    currentUser : _this.drawbridge.currentUser( req ),
    screenName : req.params.screenName
  };

  if( setup.currentUser && setup.currentUser.screenName === setup.screenName ){
    req.setup = setup;
    next();
  }else{
    res.json('', 404);
  }
}

exports.saveProfile = function( req, res, next ){
  /*
    Grades 1 - 6
    Grades 7, 8
    Grades 9 - 12
    University
    Community College
    Government
    Corporate
    Other
  */
  var profile = {
    fullname : req.param('fullname'),
    organizationType : req.param('organizationType'),
    organizationName : req.param('organizationName'),
    organizationSubject : req.param('organizationSubject'),
  }


  redis.hmset( req.setup.currentUser.email, profile, function( error, result ){

    if(error){
      res.json('Database error', 404);
    }else{

      req.session.user.fullname = profile.fullname;
      req.session.user.organizationType = profile.organizationType;
      req.session.user.organizationName = profile.organizationName;
      req.session.user.organizationSubject = profile.organizationSubject;

      res.json('');
    }
  });

}