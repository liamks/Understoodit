$(function(){
  User = Backbone.Model.extend({
    toJSON : function(){
      return {
        'loggedIn' : this.get('loggedIn'),
        'email'    : this.get('email')
      }
    }
  });

  AccountNavView = Backbone.View.extend({
    template:  _.template(templates['account-nav']),

    render : function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this.$el;
    }
  });

  var _this;

  LoginModule = function(){
    _this = this;
    this.addHandlers();
  };

  LoginModule.prototype.addHandlers = function(){
    app.events.on('connect-info', this.initialized );
    app.events.on('parentView-loaded', this.loadView );
  };

  LoginModule.prototype.loadView = function(){
    _this.view = new AccountNavView({model : _this.user, el : '#account-nav'});
    _this.view.render();
  };

  LoginModule.prototype.initialized = function(obj){
    _this.user = new User({
      teacherID : obj.teacherID,
      email : obj.email,
      loggedIn : obj.loggedIn
    })    
  };

  new LoginModule();
})