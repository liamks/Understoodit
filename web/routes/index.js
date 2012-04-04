
var crypto = require('crypto');


var tokenB = 'kwtpIq1N8/Sp6cYxEvpoQ1sG09FtodXjUb9aW+ahoM0=';
var tokenBTeacher = 'ml5qmczfz6yovJJXr0L0BEO3Av7jMfanrggteFuwMxo=';

var postMarkAPIKEY = '57c81312-8357-4f70-a2dc-983929166c79'
var postmark = require('postmark')(postMarkAPIKEY);
var riak = require('riak-js').getClient();


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

  res.render('index', { title: 'Express' })
};

exports.info = function(req, res){
  var user = req.user;
  var output = {}, tokens, socketURL;
  output.teacherID = user.teacherID;
  output.loggedIn = user.loggedIn;

  if(user.loggedIn && !user.studentID){
    // Logged in teacher
    tokens = getTokens( tokenBTeacher );
  }else{
    // Student
    tokens = getTokens( tokenB );
    output.studentID = user.studentID;
  }

  output.socketURL = (process.env.NODE_ENV === 'production') ? 'http://understoodit.com/ws' : 'http://0.0.0.0:5000';
  
  output.tokenA = tokens.tokenA;
  output.tokenC = tokens.tokenC;

  res.json(output);
};

/*
 * POST signup
 */

exports.signup = function(req, res){
  var email = req.param('email');
  var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  riak.save('signups', email, { ip : ip , time : (new Date()).toString() });

  postmark.send({
   "From" : 'signup@understoodit.com',
      "To" : email, 
      "Subject" : "Understoodit Signup",
      "TextBody" : "Thank you for signing up!!!"
  }, function(err,data){
    if(!err){
      res.json({ });
    }else{
      res.json({ error : 'Something is wrong with our email service, please try again in a bit.'});
    }
  })  
}



/*
 * GET understoodit application
 */
exports.understoodit = function(req, res){
  options = { 
    screenName : req.params.screenName,
    environment: process.env.NODE_ENV 
  };

  options.user = req.user;
  req.session.screenName = req.params.screenName;

  if(options.environment === 'development'){
    options.jsIncludes = require('../public/javascripts/app');
  }

  res.render('app/index', options);
};