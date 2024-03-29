;
(function(win){

  /* For internet explorer */
  if( typeof win.console === 'undefined' ){
    win.console = {};
  }
  if( typeof win.console.log === 'undefined' ){
    win.console.log = function(){};
  }


  var _this, mie = /MSIE (6|7|8)/;

  if( /MSIE 9/.test( navigator.userAgent ) ){
    //IE looks buggy with rounded corners...
    $('head').append($('<link>').attr({
      'rel' : 'stylesheet',
      'href' : '/stylesheets/ie.css'
    }))
  }


  BackboneApp = function(){
    this.events = _.extend( {}, Backbone.Events );
    this.fetchUserInfo();
    this.addHandlers();
  };

  BackboneApp.prototype.addHandlers = function(){
    this.events.on('initialized', function(){
      $('#loading').fadeOut(800, function(){
        $(this).remove();
        _this.events.trigger('loading-done','')
      });
    });
  };

  BackboneApp.prototype.start = function(){
    this.events.trigger( 'start', '' );
  };

  BackboneApp.prototype.processInfo = function(info){
    _this.events.trigger('connect-info', info);
  };

  BackboneApp.prototype.processAjaxError = function(info){
    $("#loading div")
      .text( "There was an error loading Understoodit, try refreshing the page." )
      .css({'color' : 'red'});
  }

  BackboneApp.prototype.mieFallBack = function(){
    $('#loading div')
      .html( "We only support Firefox, Chrome, Safari, and Internet Explorer 9 &amp; 10")
      .css({ 'color' :'red' });
  }

  BackboneApp.prototype.fetchUserInfo = function(){

    if( mie.test( navigator.userAgent )){
      this.mieFallBack();
    }else{
      _this = this;
      var screenName = location.pathname.split('/')[1];
      $.ajax({
        url     : '/info?screenName=' + screenName,
        success : _this.processInfo,
        error : _this.processAjaxError
      });
      }

  };
  win.app = new BackboneApp();


  $('body').on('click', '#nav-tabs a', function(evt){
    $('.nav-tabs .active').removeClass('active');
  })
})(window);



