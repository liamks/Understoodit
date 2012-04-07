$(function(){


  ComprehensionView = Backbone.View.extend({
    id : 'comprehension',
    template : _.template(templates['comprehension']),

    events : {
      'click #understood' : "understood",
      'click #confused'   : 'confused'
    },

    understood : function(evt){
      app.events.trigger('understood', true);
      evt.preventDefault();
    },

    confused : function(evt){
      app.events.trigger('confused', true);
      evt.preventDefault();
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
});