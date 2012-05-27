var uuid = require('node-uuid'),
    redis = require('redis').createClient(),
    _ = require('underscore')._;

//get module context
var _this = this;



exports.dbGetAllQuestions = function( userEmail, cb ){
  redis.zrange( userEmail + '-questions', 0, -1, function(e,results){
    var multi = redis.multi();

    for(var i = 0; i< results.length; i++){
      multi.hgetall( results[i] );
    }

    multi.exec(function( err, results){
      cb( err, results );
    });

  })
}

/*
GET /question/:id
*/
exports.getQuestion = function( req, res ){
  redis.hgetall( req.params.id, function( e, question){
    res.json( question );
  })
}

/*
POST /question/

{
  qtype : (custom|likert),
  options : [],
  q : '',
  screenName, ''
}

1. generate random ID
2. save question
3. add question user's sorted set of questions
4. return saved question with proper id
*/
exports.saveQuestion = function( req, res ){
  var question = {
        id : uuid.v4(),
        qtype : req.param('qtype'),
        options : req.param('options'),
        q : req.param('q')
      },
      lowerCaseEmail = req.currentUser.email.toLowerCase(),
      date = Date.now();

  redis.multi()
    .hmset( question.id, question )
    .zadd( lowerCaseEmail + '-questions', date, question.id )
    .exec( function( err, results ){

      if( err ){
        res.json( 'Database error', 404 );
      }else{
        res.json( question );
      }

    });
  
}


/*
PUT /question/:id
*/
exports.updateQuestion = function( req, res ){
  var question = {
        id : req.param('id'),
        qtype : req.param('qtype'),
        options : req.param('options'),
        q : req.param('q')
      };

  redis.hmset( question.id, question, function( err, q){
    res.json( question )
  });
}

/*
GET /questions/
*/
exports.getAllQuestions = function( req, res ){
  var lowerCaseEmail = req.currentUser.email.toLowerCase();


  exports.dbGetAllQuestions( lowerCaseEmail, function( err, questions ){
    question = _.map(questions, function(question){
      question.options = question.options.split(',');
      return question;
    })

    res.json( questions );
  });
}


