$(function(){

  RealTimeChart = function($el, innerID){
    this.percentage = 0;
    this.$container = $el;

    this.$inner =  $('<div>').attr('id', innerID).addClass('rt-inner');
    this.$text = $('<div>').addClass('rt-text');
    this.updateText();
    this.updateInnerWidth();
    
    this.$container.append( this.$inner );
    this.$container.append( this.$text );


  };

  RealTimeChart.prototype.updateText = function(){
    var str = String(this.percentage) + "%";
    this.$text.text(str);
  }

  RealTimeChart.prototype.updateInnerWidth = function(){
    //if we don't specifiy parent it will return 0 when hidden
    var containerWidth = this.$container.parent().width();
    var fraction = this.percentage / 100;
    var innerWidth = Math.ceil(containerWidth * fraction);
    
    var _this = this;
    this.$inner.animate({
      width: innerWidth
    }, 600, function(){
      if(_this.sigToZero){
        _this.$inner.css('border','none');
      }
      _this.sigToZero = false;
    })
    //this.$inner.css('width', innerWidth);
  };

  RealTimeChart.prototype.update = function(percentage){
    if(this.percentage !== percentage){
      this.percentage = percentage;
      this.updateInnerWidth();
      this.updateText();
    }

  };

  Comprehension = Backbone.Model.extend({

  });


  ComprehensionMeters = Backbone.View.extend({
    id : 'comprehension-meters',
    className : '',
    template : _.template(templates['comprehension-meters']),

    initialize : function(){
      

      this.comprehension = new Comprehension ({ 
        understanding : 0 ,
        time: (new Date()).getTime(),
        confusion: 0 });

      this.comprehension.on('change', this.changeMeters, this);
    },

    changeMeters : function(){

      var confusion = this.comprehension.get('confusion');
      var understanding =  this.comprehension.get('understanding');
      var array;

      if(this.$confusometer){
        this.confusometer.update(confusion);
        this.understandometer.update(understanding);
        this.timeSeries.addPoint(confusion, understanding, (new Date).getTime());
      }

    },

    updateMeters : function(state){
      this.comprehension.set({
          'understanding' : state.understanding,
          'confusion'     : state.confusion,
          time: (new Date()).getTime()
      });
    },

    render : function(el){
      this.$el.html( this.template({}) );
      $(el).append( this.$el );
      
      this.$confusometer = this.$el.find('#confusometer');
      this.$understandometer = this.$el.find('#understandometer');

      this.confusometer = new RealTimeChart(this.$confusometer, 'confusometer-inner');
      this.understandometer = new RealTimeChart(this.$understandometer, 'understandometer-inner');

      this.timeSeries = new TimeSeries('real-time-graph');
       
      //Without this if the class confusion is at 100% and teachers refreshes their page
      //they will see a confusion of 0 until the confusion levels change
      this.changeMeters();
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

    render : function(isTeacher){
      this.$el.html( this.template({isTeacher: isTeacher}) );
      $('.tab-content').before( this.$el );
      this.$numStudents = this.$el.find('#numStudents');
      this.$active = this.$el.find('#active');
      this.changeState();
      if(!isTeacher){
        $('#teacherID').css('border-top-right-radius','5px');
      }
      return this.$el;
    },

    addTeacherID : function(teacherID){
      $('#teacherID').text(teacherID);
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
        _this.comprehensionMeters.changeMeters() ;
      }else if(!studentsCanSeeComprehension && _this.studentsCanSeeComprehension){
        _this.studentsCanSeeComprehension = false;
        _this.comprehensionMeters.remove();

      }
    }
  };


  ClassStateModule.prototype.parentViewLoaded = function(){
    if(_this.isTeacher){
      _this.comprehensionMeters.render('#dashboard-content');
      _this.state.render(_this.isTeacher);
      
    }else{
      _this.state.render(_this.isTeacher);
      if(_this.studentsCanSeeComprehension){
      _this.comprehensionMeters.render('#dashboard-content');

      }
    };
    _this.state.addTeacherID(_this.teacherID);
  };

  ClassStateModule.prototype.connect = function(obj){
    _this.isTeacher = obj.isTeacher;
  };

  ClassStateModule.prototype.connectInfo = function(obj){
    _this.studentsCanSeeComprehension = obj.settings.studentsCanSeeComprehension;
    _this.teacherID = obj.teacherID;

  }

  ClassStateModule.prototype.lectureState = function(state){
    _this.comprehensionMeters.updateMeters( state );
    _this.state.updateState( state );
  };

  new ClassStateModule();
});