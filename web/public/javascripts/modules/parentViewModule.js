$(function(){
  var _this;

  
  StudentView = Backbone.View.extend({

  });


  TeacherView = Backbone.View.extend({

  });


  ParentView = Backbone.View.extend({
    id: 'parent-view',

    template : _.template(templates['parentView']),

    initialize: function(options){
      this.isTeacher = options.isTeacher;
      this.childView = options.isTeacher ? new TeacherView() : new StudentView();
    },

    render : function(){
      this.$el.html( this.template({}) );
      this.childView.render()
      $('body').append(this.$el);
      app.events.trigger('parentView-loaded','');
    },

  });

  ParentViewModule = function(){
    this.addHandlers();
    _this = this;
  };

  ParentViewModule.prototype.addHandlers = function(){
    app.events.on('initialized', this.initialized);
    app.events.on('loading-done', this.loadingDone );
  };


  ParentViewModule.prototype.initialized = function(obj){
    _this.isTeacher = obj.isTeacher;
  }

  ParentViewModule.prototype.loadingDone = function(){

    _this.parentView = new ParentView({ isTeacher : _this.isTeacher });
    _this.parentView.render();
  };


  new ParentViewModule();
});