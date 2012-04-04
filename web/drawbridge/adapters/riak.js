var _ = require('underscore')._;
var db = require('riak-js').getClient();

module.exports = {
  create: function(options, cb){

    var properties = {
      email : options.email,
      password : options.password,
      salt: options.salt
    };

    var meta = {
      index : { email : properties.email }
    }

    db.save('users', options.screenName, properties, meta, cb);
  },

  find: function(screenName, cb){
    db.get('users', screenName, cb);
  },

  findByEmail: function(email, cb){
    db.query('users', { email: email }, cb );
  },

  findByResetLink: function(resetLink, cb){
    db.query('users', { resetLink: resetLink }, cb);
  },

  save: function(screenName, newValues, cb){
    db.get('users', screenName, function(err, data, meta){
      var user = data;
      var keys = _.keys(newValues);
      for (var i = keys.length - 1; i >= 0; i--) {
        user[keys[i]] = newValues[keys[i]];
      };

      meta.index = { email : data.email }
      db.save('users', screenName, user, meta, cb);
    });
    
  },




}