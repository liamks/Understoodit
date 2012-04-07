$(function(){

  Comprehension = Backbone.Model.extend({

  });

  ComprehensionMeters = Backbone.View.extend({
    id : 'comprehension-meters',
    className : '',
    template : _.template(templates['comprehension-meters']),

    initialize : function(){
      this.comprehension = new Comprehension ({ understanding : 0 , confusion: 0 });
      this.comprehension.on('change', this.changeMeters, this);
    },

    changeMeters : function(){

      var confusion = this.comprehension.get('confusion');
      var understanding =  this.comprehension.get('understanding');
      if(this.$confusometer){
        this.$confusometer.text(confusion);
        this.$understandometer.text(understanding);
      }

    },

    updateMeters : function(state){
      this.comprehension.set({
          'understanding' : state.understanding,
          'confusion'     : state.confusion
      });
    },

    render : function(el){
      this.$el.html( this.template({}) );
      $(el).append( this.$el );
      
      this.$confusometer = this.$el.find('#confusometer');
      this.$understandometer = this.$el.find('#understandometer');

      return this.$el;
    }

  });


  State = Backbone.Model.extend({

  });

  ClassStateView = Backbone.View.extend({
    id: 'class-state',
    template : _.template(templates['class-state']),

    initialize : function(){
      this.state = new State({ numStudents : 0, active : 0 });
      this.state.on('change', this.changeState, this);
    },

    changeState : function(){
      var numStudents = this.state.get('numStudents');
      var active = this.state.get('active');

      if(this.$numStudents){
        this.$numStudents.text(numStudents);
        this.$active.text(active);
      }

    },

    updateState : function(state){
      this.state.set({
        'numStudents' : state.numStudents,
        'active' : state.active
      })
    },

    render : function(){
      this.$el.html( this.template({}) );
      $('#dashboard-button-header').append( this.$el );
      this.$numStudents = this.$el.find('#numStudents');
      this.$active = this.$el.find('#active');
      this.changeState();
      return this.$el;
    }

  });




  var _this;
  ClassStateModule = function(){
    this.addHandlers();
    _this = this;
    _this.comprehensionMeters = new ComprehensionMeters();
    _this.state = new ClassStateView();
  };

  ClassStateModule.prototype.addHandlers = function(){
    app.events.on('lecture-state', this.lectureState );
    app.events.on('initialized', this.connect );
    app.events.on('parentView-loaded', this.parentViewLoaded );
    app.events.on('settings', this.settings);
    app.events.on('connect-info', this.connectInfo);
  };


  ClassStateModule.prototype.settings = function(settings){
    if(!_this.isTeacher){
      var studentsCanSeeComprehension = settings.studentsCanSeeComprehension;
      if(studentsCanSeeComprehension && !_this.studentsCanSeeComprehension) {
        _this.studentsCanSeeComprehension = true;
        _this.comprehensionMeters.render('#dashboard-content');
      }else if(!studentsCanSeeComprehension && _this.studentsCanSeeComprehension){
        _this.studentsCanSeeComprehension = false;
        _this.comprehensionMeters.remove();

      }
    }
  };


  ClassStateModule.prototype.parentViewLoaded = function(){
    if(_this.isTeacher){
      _this.comprehensionMeters.render('#dashboard-content');
      _this.state.render();
    }else{
      if(_this.studentsCanSeeComprehension){
      _this.comprehensionMeters.render('#dashboard-content');

      }
    };
  };

  ClassStateModule.prototype.connect = function(obj){
    _this.isTeacher = obj.isTeacher;
  };

  ClassStateModule.prototype.connectInfo = function(obj){
    _this.studentsCanSeeComprehension = obj.settings.studentsCanSeeComprehension;
  }

  ClassStateModule.prototype.lectureState = function(state){
    _this.comprehensionMeters.updateMeters( state );
    _this.state.updateState( state );
  };

  new ClassStateModule();
});