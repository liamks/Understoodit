var knox = require('knox'),
    fs = require('fs');


var client = knox.createClient({
    key: 'AKIAJUXLQ6ZMGPIW5GGA'
  , secret: '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'
  , bucket: 'understoodit-db-snapshot'
});


function saveRedisDBToS3(){
  //milliseconds since 1970
  var timeStamp = Date.now().toString();

  fs.readFile( '/var/lib/redis/dump.rdb', function( err, buf ){
    var req = client.put('redisDB-' + timeStamp + '.rdb', {
      'Content-Length' : buf.length,
      'Content-Type' : 'application/octet-stream',
      'x-amz-acl': 'private' 
    });

    req.on('response', function(res){
      if(200 == res.statusCode ){
        console.log( 'saved to s3 at: ' + timeStamp );
      }else{
        console.log( 'failed at: ' + timeStamp );
      }
    });

    req.end(buf);

  });
}


//Every eight hours
var timeInterval = 1000 * 60 * 60 * 8;

setInterval( saveRedisDBToS3, timeInterval );