$(function(){

  var $screenNameInput = $('input[name=screenName]'),
      $screenNameURL = $('#screenNameURL'),
      timeoutID, screenName;

  function updateURL(){
    screenName = $screenNameInput.val() === '' ? 'YOURSCREENNAME' : $screenNameInput.val().toLowerCase();
    
    if(/[^A-Za-z0-9_\-]/.test( screenName  )){

      if($('#invalidSreenName').length == 0 ){
        $(".help-block").before(
          $('<p>').attr( 'id', 'invalidSreenName' ).text(
            'Screen names can only contain letters, numbers, or the underscore or dash characters.')
          );
      }

    }else{
      $('#invalidSreenName').remove();
    }

    $screenNameURL.text( screenName );
    screenName == 'YOURSCREENNAME' ? $screenNameURL.css('color', 'red') : $screenNameURL.css('color', 'green')
  }

  $screenNameInput.focus(function(){
    timeoutID = setInterval( updateURL, 80 );
  });

  $screenNameInput.focusout(function(){
    clearTimeout( timeoutID );
  })
})