//get module context
var _this = this;

/*
getAllQuestions returns an array of question objects
associated with the currently logged in user.

Example response:
[
 { 
  id : '2345AB8'
   q : 'What is the distance to the moon',
   options {
    a : 123,
    b : 2353,
    c : 4566
   },
   correctOption: a
   },

 { 
  id : '2345AB9'
   q : 'What is the distance to Saturn',
   options {
    a : 1233,
    b : 55353,
    c : 4266
   },
   correctOption: b
   },
]

 
 assume webrequest comes from
 understoodit.com/liam

 - Must check and see if user is logged in.
 - If user is logged in need to check that currently
 logged (screenName) matches === liam
 - if so we retreive all users questions,
 - if not we return json with status 404

*/
exports.getAllQuestions = function( req, res ){
  var currentUser = _this.drawbridge.currentUser( req );
}



/*
 need to check if user is logged, etc
 using an AJAX post request, saveQuestion should be able
 to save the current question. If it already exists, update
 it, otherwise create new question AND add the
 new question to the current user's sortedset of questions

*/
exports.saveQuestion = function( req, res ){

}