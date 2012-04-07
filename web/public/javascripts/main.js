(function(win){
  var _this;

  BackboneApp = function(){
    this.events = _.extend( {}, Backbone.Events );
    this.fetchUserInfo();
    this.addHandlers();
  };

  BackboneApp.prototype.addHandlers = function(){
    this.events.on('initialized', function(){
      $('#loading').fadeOut(1600, function(){
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

  BackboneApp.prototype.fetchUserInfo = function(){
    _this = this;

    $.ajax({
      url     : '/info',
      success : _this.processInfo
    });
  };

  win.app = new BackboneApp();
})(window);


$(function(){
  app.start();
})
