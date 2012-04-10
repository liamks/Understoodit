$(function(){

  var _this;
  NotificationsModule = function(){
    _this = this;
    this.addHandlers();
  };

  NotificationsModule.prototype.addHandlers = function(){
    app.events.on('notification', this.handleNotification );
  };

  NotificationsModule.prototype.handleNotification = function(notification){
    _this.$notificationMessage = (_this.$notificationMessage || $("#notification-message"));
    notification.classTag = (notification.classTag || 'success' );
    notification.duration = (notification.duration || 4000 );
    _this.$notificationMessage.addClass(notification.classTag);
    _this.$notificationMessage.text(notification.message)

    _this.$notificationMessage.fadeOut(notification.duration, function(evt){
      _this.$notificationMessage.removeAttr('style')
      _this.$notificationMessage.removeClass(notification.classTag);
    })
  };

  new NotificationsModule();
});