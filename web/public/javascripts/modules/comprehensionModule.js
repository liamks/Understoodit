(function(){


  ComprehensionView = Backbone.View.extend({
    id : 'comprehension',
    template : _.template(templates['comprehension']),

    events : {
      'click #understood' : "understood",
      'click #confused'   : 'confused'
    },

    initialize: function(){
      this.active = true;
    },

    understood : function(evt){
      if(this.active){
        app.events.trigger('understood', true);
        this.triggerNotification('understanding');
        this.inactivateButtons();
      }

      evt.preventDefault();
    },

    confused : function(evt){
      if(this.active){
        app.events.trigger('confused', true);
        this.triggerNotification('confusion'); 
        this.inactivateButtons();
      }

      evt.preventDefault();
    },

    inactivateButtons : function(){
      this.active = false;
      var _this = this;
      this.$el.find('a').addClass('inactive');
      setTimeout(function(){
        _this.active = true;
        _this.$el.find('a').removeClass('inactive');
      }, 8000);
    },

    triggerNotification: function(type){
      var message = "Your " + type + " has been acknowledged!"
      app.events.trigger('notification', {
        message: message
      });
    },

    render: function(){
      this.$el.html( this.template({}) );
      $('#dashboard-content').append(this.$el);
      return this.$el;
    }

  });

  var _this;
  ComprehensionModule = function(){
    this.addHandlers();
    _this = this;
  };

  ComprehensionModule.prototype.addHandlers = function(){
    app.events.on('initialized', this.initialized);
    app.events.on('parentView-loaded', this.loadView);

  };

  ComprehensionModule.prototype.initialized = function(obj){
    _this.isTeacher = obj.isTeacher;
    app.events.off('initialized', _this.initialized);
  }

  ComprehensionModule.prototype.loadView = function(){
    _this.comprehension;
    if(! _this.isTeacher){
      _this.comprehension = new ComprehensionView();
      _this.comprehension.render();
    }
  }


  new ComprehensionModule();
}).call(this);