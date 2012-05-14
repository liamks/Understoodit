/*
Need to iterate over each of:
waitlist ( sorted set )
invited ( hash )
unconfirmed ( hash )
users ( sorted set )
screenNames ( hash )

first rename the user's email key (downcase),
then downcase the key in the list


load all emails into memory, downcase them, put them into an array.
perform transformation and see if all emails return a user.
*/


var redis = require('redis').createClient(6380),
    _ = require('underscore')._,
    emailsBefore, emailsAfter;

hgetallArray = function( array, cb ){
  var multi = redis.multi();

  for (var i = array.length - 1; i >= 0; i--) {
    multi.hgetall( array[i] );
  };

  multi.exec( cb );
}



getAllEmails = function( fn ){
  redis.multi()
    .zrange( 'waitlist', 0, -1 )
    .zrange( 'users', 0, - 1 )
    .hvals( 'invited' )
    .hvals( 'unconfirmed' )
    .exec( function( e, results ){
      console.log('Waitinglist: ' + String(results[0].length))

      fn( _.flatten( results ) );
    })
}




renameSortedSet = function( setName, original_email, lowerCase_email , fn ){
  redis.zscore( setName, original_email, function( e, score ){
    score = Number(score);
    redis.multi()
      .zrem( setName, original_email )
      .zadd( setName, score, lowerCase_email )
      .rename( original_email, lowerCase_email )
      .exec( fn )

  });
}


getSortedSet = function( setName, fn ){

  redis.zrange( setName, 0, -1, function( err, results ){
    if(err){
      console.log('ERROR with: ' + setName );
    }else{
     
      var original_email, lowerCase_email, d = 0;

      for (var i =0; i < results.length ; i++) {
        original_email = results[i];
        lowerCase_email = original_email.toLowerCase();
        renameSortedSet( setName, original_email, lowerCase_email, function(){
          d += 1
          if(original_email === 'Mubeen.a.malik@gmail.com'){
            console.log('herere')
          }
          if(d == results.length - 1){
            fn();
          }
        })
      };
    }
  });
}
var done = 0;

getSortedSet('waitlist', function(){
  console.log('waitlist done')
  done += 1;
});
getSortedSet('users', function(){
  console.log('users done')
  done += 1
});


renameHash = function( hashName, key, original_email, lowerCase_email, fn ){
  redis.multi()
    .rename( original_email, lowerCase_email )
    .hset( hashName, key, lowerCase_email )
    .exec( fn );
}

getHash = function( hashName, fn ){

  redis.hgetall( hashName, function( e, hash ){

    if( e ){
      console.log('ERROR with: ' + hashName );
    }else{
      var keys = _.keys( hash ), lowerCase_email, original_email, d= 0;

      for (var i =0; i < keys.length ; i++) {
        original_email = hash[ keys[i] ];
        lowerCase_email = original_email.toLowerCase();
        renameHash( hashName, keys[i], original_email, lowerCase_email , function(){
          d+= 1;



          if(d == keys.length){
            fn();
          }
        });
        

      };

    }

  })

}

getHash('invited', function(){
  console.log('invited done')
  done += 1
});
getHash('unconfirmed', function(){
    console.log('unconfirmed done')
  done += 1
});
getHash('screenNames', function(){
    console.log('screenNames done')
  done += 1
});

finish = function(){


  getAllEmails(function(emails){

    var checked = 0;
    for(var i = 0; i< emails.length; i++){

      (function(email){
        var lowerCase_email = email.toLowerCase();

        redis.hget( lowerCase_email, 'stage', function(e,d){
          if(d == null){
            throw new Error( 'email: ' + lowerCase_email + ' | ' + email )
          }

          checked += 1
          if(checked == emails.length){
            redis.end()

          }

        })

      })(emails[i]);

    }

  })

}

var interval = setInterval(function(){
  if(done === 5){
    clearInterval(interval);
    finish();
  }
}, 100 )

