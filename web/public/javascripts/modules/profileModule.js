(function(){


  ProfileModel = Backbone.Model.extend({

    toJSON : function(){
      return {
        fullname : this.get('fullname'),
        organizationType : this.get('organizationType'),
        organizationName : this.get('organizationName'),
        organizationSubject : this.get('organizationSubject')
      }
    }
  });

  ProfileView = Backbone.View.extend({
    template : _.template( templates['profile'] ),


    initialize : function(){
      this.model.on('change', this.profileChanged );
    },

    profileChanged : function(){
      /* Save it */
      /* scope is model*/
      var url = '/' + _this.teacherID + '/profile';
      $.post( url, this.toJSON() )
        .success( function(){
          app.events.trigger('notification', {
            message : 'Your profile has been updated'
          })
        })
        .error( function(data){
          app.events.trigger('error', {
            message : 'There was an error updating your profile'
          })
        })
    },

    id : 'userProfile',
    className : 'tab-page fade',


    render : function(){
      this.$el.html( this.template( this.model.toJSON() ) );
      var sel = this.model.get('organizationType')
      this.$el.find('select[name=organizationType] option[value=' +  sel + ']').attr('selected','selected')
      $('.tab-content').append( this.$el );

    }
  })


  var _this;

  function Profile(){
    _this = this;
    this.addHandlers();
  }

  Profile.prototype.addHandlers = function(){
    app.events.on('connect-info', this.connectInfo );
    app.events.on('parentView-loaded', this.loadView );
    app.events.on('loginModule-loaded', this.loginModuleLoaded );
  }

  Profile.prototype.loginModuleLoaded = function(){
    $('.pull-right').on('click', '#userProfileNav', _this.navClick );
    $('.tab-content').on('click', '#userProfile input[type=submit]', _this.saveSettings );
  }

  Profile.prototype.saveSettings = function(evt ){
    var newValues = {
      fullname: $('input[name=fullname]').val(),
      organizationType : $('select[name=organizationType] option:selected').val(),
      organizationName : $('input[name=organizationName]').val(),
      organizationSubject : $('input[name=organizationSubject]').val()
    };

    _this.profile.set( newValues );
    evt.preventDefault();
  }

  Profile.prototype.navClick = function( evt ){
    $(this).parent().addClass('active');
    $('#nav-tabs .active').removeClass('active');
    $('.tab-page').hide();
    $('#userProfile').fadeIn('fast');
    evt.preventDefault();

  }

  Profile.prototype.loadView = function(){
    _this.parentLoaded = true;
    if( _this.hasConnectInfo ){
      _this.view.render();
    }
    
  }




  Profile.prototype.connectInfo = function( info ){
    _this.teacherID = info.teacherID;
    _this.profile = new ProfileModel( info.profile );
    _this.view = new ProfileView({ model : _this.profile });
    _this.hasConnectInfo = true;
    if(_this.parentLoaded){
      _this.view.render();
    }
  }

  new Profile();
}).call(this);