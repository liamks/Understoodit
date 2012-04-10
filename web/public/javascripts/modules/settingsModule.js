$(function(){


  Settings = Backbone.Model.extend({
    toJSON : function(){
      return {
        studentsCanSeeComprehension : this.get('studentsCanSeeComprehension')
      }
    }
  });


  SettingsView = Backbone.View.extend({
    template : _.template( templates['settings'] ),

    id : 'settings',
    className : 'tab-page fade',

    initialize : function(){
      this.model.on('change', this.settingsChanged );
    },

    saveChanges : function(evt){
      var scsc = this.$studentsCanSeeComprehension.attr('checked') === 'checked';
      this.model.set({
        studentsCanSeeComprehension : scsc
      });

      app.events.trigger('notification', {
        message: "Your new settings have been saved."
      });

      var url = "/" + this.model.get('teacherID') + '/settings';
      var _this = this;
      $.post(url, this.model.toJSON())
        .success( function(data){
          app.events.trigger('send-settings', _this.model.toJSON() );
        })
        .error( function(data){
          console.log('ERROR: ' + data );
        });

      evt.preventDefault();
    },

    updateSettings : function( newSettings){
      this.model.set({
        studentsCanSeeComprehension : newSettings.studentsCanSeeComprehension
      });

      this.$el.html( this.template( this.model.toJSON() ));
      this.addFormHandlers();
    },

    settingsChanged : function(newSettings ){
      console.log( 'settings have changed' );
      console.log( newSettings )
    },

    addFormHandlers : function(){
      this.$form = this.$el.find('form');
      this.$form.on('submit', $.proxy(this.saveChanges,this));
      this.$studentsCanSeeComprehension = this.$form.find("input[name=studentsCanSeeComprehension]");
    },


    render : function(){
      this.$el.html( this.template( this.model.toJSON() ));
      
      $(".tab-content").append(this.$el);

      $("#nav-tabs").append($("<li>").append($("<a>").attr({
        'href' : '#settings',
        'data-toggle' : 'tab'
      }).text('Settings')))

      this.addFormHandlers();
      return this.$el
    }
  });

  SettingsModule = function(){
    _this = this;
    this.addHandlers();
  };


  SettingsModule.prototype.addHandlers = function(){
    app.events.on('connect-info', this.connectInfo );
    app.events.on('settings', this.updateSettings );
    app.events.on('parentView-loaded', this.loadView );
    app.events.on('initialized', this.initialized);
  };

  SettingsModule.prototype.loadView = function(){
    if(_this.isTeacher){
      _this.view.render();
    };
  };

  SettingsModule.prototype.initialized = function(obj){
    _this.isTeacher = obj.isTeacher;
  };

  SettingsModule.prototype.updateSettings = function(settings){
    _this.view.updateSettings(settings);
  };

  SettingsModule.prototype.connectInfo = function(info){
    info.settings.teacherID = info.teacherID;
    _this.settings = new Settings(info.settings);
    _this.view = new SettingsView({ model : _this.settings })
  };

  new SettingsModule();

})