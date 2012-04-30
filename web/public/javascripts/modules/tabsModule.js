(function(){

  var _this;
  TabsModule = function(){
    _this = this;
    this.addHandlers();

    
  };


  TabsModule.prototype.addClickHandler = function(){
    _this.$navCollapse = $('#nav-collapse');
    _this.addMenuHandler();
    $(".num-outer").each(function(){
      $(this).tooltip({
        title : $(this).attr('title')
      })
    })
    

    $("#nav-tabs").on('click', 'a', function(evt){
      $('#nav-tabs li').removeClass('active');
      $(this).parent().addClass('active')
      var $tabPages = $('.tab-page');
      $tabPages.removeClass('active');
      $tabPages.hide();
      var id = $(this).attr('href');
      $(id).addClass('active').fadeIn();

      _this.$navCollapse.addClass('collapse');
      evt.preventDefault();
    })
  }

  TabsModule.prototype.addHandlers = function(){
    app.events.on('parentView-loaded', this.addClickHandler );
  };

  TabsModule.prototype.addMenuHandler = function(){
    $('#menu a').click(function(evt){
      _this.$navCollapse.toggleClass('collapse');
      
      evt.preventDefault();
    })
  };

  new TabsModule();
}).call(this);