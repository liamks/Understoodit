(function(){

  var isTeacher;

  var Question = Backbone.Model.extend({

    url : '/question/',

    initialize : function(options){
      this.on('change', this.updateView );

    },

    updateView : function(){
      console.log(this.id)
      console.log(this.view)
    },
    
    defaults: {
      "qtype" : "likert",
      "options" : ['','','','','']
    },

    toJSON : function(){

      return {
        id : this.get('id'),
        q : this.get('q'),
        options : this.get('options'),
        qtype : this.get('qtype')
      }
    }
  });

  var Questions = Backbone.Collection.extend({
    url : '/questions/',

    model: Question,

    initialize: function(options){
      this.parentView = options.parentView;
      this.on( 'add', this.addAModel );
      this.on( 'reset', this.addManyModels );
    },

    addAModel : function( model ){
      this.parentView.renderOneQuestion( model );
    },

    addManyModels : function(){
      var _this = this;
      this.each(function(model){
        _this.addAModel(model)
      })
    }
  })


  var questionsCollection;

  var QuestionFormView = Backbone.View.extend({
    template : _.template( templates['questionForm'] ),
    tagName: 'li',
    className: 'question',

    initialize : function(options){
      this.parent = options.parentView;
      this.questionView = options.questionView;
    },

    events : {
      'click #question-cancel' : 'cancel',
      'click #question-save' : 'save',
      'click input[name=qtype]' : 'selectType'
    },

    selectType : function(evt){
      var $currentlySelected = $('.an-option.active');
      $currentlySelected.removeClass('active') 
      this.$el.find('input[name=qtype]').removeAttr('checked')
      $(evt.currentTarget).attr('checked', 'checked')
      this.$el.find('#' + $(evt.currentTarget).attr('value')).addClass('active')
    },

    cancel : function(){
      this.parent.removeForm();
      this.$el.remove();
      if(this.questionView){
        this.questionView.$el.show();
      }
    },

    getOptions : function(){
      return _.map(this.$el.find('input[type=text]'), function(el){
        return $(el).attr('value');
      });
    },

    save : function(){
      var qtype = this.$el.find('input[checked=checked]').attr('value');
      if(qtype == 'custom'){
        var options = this.getOptions();
      }else{
        var options = [
          'Strongly Agree', 'Agree', 'Neutral',
          'Disagree', 'Strongly Disagree'
        ]
      }
      var question = this.$el.find('textarea').val();
      var output = {
        qtype : qtype,
        options : options ? options : [],
        q : question,
        screenName : location.pathname.replace('/','').replace('#','')
      }

      if(this.questionView){
        // editing a question
        this.model.set(output).save();
        this.questionView.render();
      }else{
        questionsCollection.create( new Question(output) );
      }
      

      this.cancel();
      
    },

    render : function(){
      this.$el.html( this.template( this.model.toJSON() ));
      return $('.question-panel').prepend( this.$el )
    }

  })

  /*
    View for an individual question
  */
  var QuestionView = Backbone.View.extend({
    template : _.template( templates['questionTeacher']),
    tagName : 'li',
    className: 'question',

    events : {
      'click .ask-question' : 'askQuestion',
      'click .done-asking-question': 'doneAsking',
      'click .delete-question' : 'delete',
      'click .edit-question'  : 'edit',
      'click .close-asking-question' : 'closeAsking'
    },

    delete : function(evt){
      if(window.confirm("Are you sure you want to remove this question?")){
        var _this = this;
        this.$el.fadeOut(function(){
         _this.$el.remove();
        })
      }


    },

    edit : function(evt){
      this.$el.hide();
      this.qForm = new QuestionFormView({
        model: this.model,
        parentView: this.parent,
        questionView : this
      }).render()
    },
    
    askQuestion : function(evt){
      this.asking = true;

      this.$el.addClass('asking');

      app.events.trigger( 'question-ask', this.model.id );
      app.events.trigger( 'notification', {
        message : "You've just asked your class a question!"
      });

      this.$el.find('.ask-question').hide();
      this.$el.find('.done-asking-question').show();
      this.$el.find('.q-result').show();
      app.events.on('lecture-state',  this.lectureState, this);
    },

    lectureState : function( state ){
      var question =  state['questions'] ? state['questions'][this.model.id] : undefined, 
            _this = this,
            n = state['numStudents'];

      if(question === undefined){
        return;
      }

      var answers = _.toArray( question )[0];

      _.each( answers, function(answer, index ){
        var $li = $(_this.$el.find('div.q-result')[index]),
            ratio = answer/n,
            percent = Math.ceil(ratio * 100),
            width = 200 * (ratio);

        $li.find('.percent-value').text(answer + " (" + percent + "%)");
        $li.find('.percent-box').width( width );
      })
    },

    updateQStatus : function(){
      if( this.timeLeft == 0 ){
        clearInterval( this.timeOut )
        this.$el.find('.q-status').hide();
        // done
      }else{
        this.$el.find('.q-status').text(
          this.timeLeft + " seconds to answer!"
        )
        this.timeLeft = this.timeLeft - 1
      }
      
    },

    closeAsking : function(){
      this.asking = false;
      this.$el.removeClass('asking');
      this.$el.find('.close-asking-question').hide();
      this.$el.find('.ask-question').show();
      
      this.$el.find('.q-result').hide();
    },

    doneAsking : function(evt){

      var _this = this;
      setTimeout(function(){
        
        _this.$el.find('.close-asking-question').show();

        app.events.off('lecture-state', _this.lectureState, _this);
      }, 30 * 1000)
      _this.$el.find('.done-asking-question').hide();
      this.$el.find('.q-status').text("30 seconds to answer!");
      this.$el.find('.q-status').show();
      this.timeLeft = 30;
      this.timeOut = setInterval(  $.proxy( this.updateQStatus, this ), 1000 );
      app.events.trigger('question-done', this.model.id );
      
    },

    render : function(){
      this.$el.html( this.template( this.model.toJSON() ) );
      return this.$el;
    },

    editMode: function(){
      if(this.editModeOn){
        this.editModeOn = false;
        this.$el.find('.q-edit-buttons').hide();
        this.$el.find('.q-buttons').show();
      }else{
        this.editModeOn = true;
        this.$el.find('.q-edit-buttons').show();
        this.$el.find('.q-buttons').hide();
      }
    }

    /* Need an update method */
    /* this view should handle it's own clicks (e.g. ask)*/
  })

  /*
  QuestionsView contains the "parent view" for the questions
  */
  var QuestionsView = Backbone.View.extend({
    template : _.template( templates['questionsTeachers']),

    initialize : function(){
      questionsCollection = new Questions({
        parentView: this
      });
      questionsCollection.fetch();
      this.views = [];
      this.editMode = false;
    },

    events :{
      'click #new-question' : 'newQuestion',
      'click #edit-questions' : 'editQuestions',

    },

    removeForm : function(){
      this.questionForm = undefined;
    },

    newQuestion : function(evt){
      if( !this.questionForm ){
        this.questionForm = new QuestionFormView({
          model : new Question(),
          parentView : this
        }).render();
        
      }
      evt.preventDefault();
    },



    editQuestions : function(evt){
      var target = evt && evt.currentTarget ? evt.currentTarget : this.$el.find('#edit-questions');
      this.editMode = ! this.editMode;
      _.each(this.views, function(view){
        view.editMode();
      })
      if(this.editMode){
        $(target).text('Done');
      }else{
        $(target).text('Edit')
      }
    },

    render: function(){
      this.$el.html( this.template({}));
      return this.$el;
    },

    renderOneQuestion: function(model){
      var qView = new QuestionView( {model : model} );
      model.view = qView;
      qView.parent = this;
      this.$el.find('#question-custom').prepend(
        qView.render()
      )
      this.views.push(qView);
    },

  });



  var StudentQuestion = Backbone.View.extend({
    template : _.template( templates['studentQuestion']),
    tagName : 'li',
    className : 'question student-question',
    
    events : {
      'click .done-answering-question' : 'answered'
    },

    initialize: function(){
      app.events.on('question-done-student', this.questionDone, this );
    },  

    questionDone : function( msg ){
      if(msg.questionID === this.model.id ){
        alert("Answering time is nearly up, you have 30 seconds to answer!");
        
        this.timeOut = setTimeout( $.proxy( this.remove, this ), 30 * 1000 );

      }
    },

    remove : function(){
      app.events.off('question-done-student', this.questionDone, this );
      var _this = this;
      this.$el.fadeOut(function(){
        _this.$el.remove();
      });  
    },

    answered : function(evt){
      window.clearTimeout( this.timeOut );
      var selection = this.$el.find('input[name=answer]:checked').val()

      if(selection === undefined){
        alert('You must select an answer!');
      }else{
        app.events.trigger( 'question-answer', {
          selected: selection,
          questionID : this.model.id });
        app.events.trigger( 'notification', {
          message : "Your answer has been sent!"
        });
        app.events.off('question-done-student', this.questionDone, this );
        var _this = this;
        this.$el.fadeOut(function(){
          _this.$el.remove();
        });  
      }

    },

    render : function(){
      this.$el.html( this.template( this.model.toJSON() ) );
      return this.$el;
    }
  });

  var StudentQuestionView = Backbone.View.extend({
    tagName : 'ul',
    className : 'question-panel',
    id : 'question-custom',

    initialize : function(){
      
    },

    render : function(){
      $('#question-content').html( this.$el );
    },

    addQuestionView : function($el){
      this.$el.append( $el );
    }

  });


  var _this;

  QuestionsModule = function(){
    _this = this;
    this.addHandlers();
    _this.queuedQuestions = [];
  }


  QuestionsModule.prototype.addHandlers = function(){
    app.events.on('connect-info', this.initialized );
    app.events.on('parentView-loaded', this.loadView );
    app.events.on('question-received', this.questionReceived );

  }



  QuestionsModule.prototype.questionReceived = function( question ){
    question.options = question.options.split(',');
    var view = new StudentQuestion({
      model: new Question(question)
    });
    view = view.render();

    if(_this.view == undefined){
      _this.queuedQuestions.push( view );
    }else{
      _this.view.addQuestionView(view);
    }
    
    /* If a student connects after a question has been asked
      they will receive the question before _this.view has
      been rendered.
    */
  }

  QuestionsModule.prototype.initialized = function( obj ){
    _this.connectInfoLoaded = true;
    _this.connectInfo = obj;
    isTeacher = obj.loggedIn && !obj.studentID;
    if(_this.parentViewLoaded ){
      _this.loadView();
    }

  }

  QuestionsModule.prototype.loadView = function(){
    _this.parentViewLoaded = true;

    if(_this.connectInfoLoaded){

      if(isTeacher){
        _this.view = new QuestionsView({
          el : $('#question-content')
        });
        _this.view.render();
      }else{
        _this.view = new StudentQuestionView();
        _this.view.render();

        if( _this.queuedQuestions.length > 0 ){
          _.each( _this.queuedQuestions, function( questionView ){
            _this.view.addQuestionView( questionView );
          })
        }
      }

    }
  }

  new QuestionsModule();  

}).call(this);