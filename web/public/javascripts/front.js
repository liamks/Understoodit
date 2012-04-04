$(function(){
  var start = (new Date()).getTime();

  var submissionComplete = function(message){
    var msg = message.error || "Thank you for your signing up!"
    $('#signup').text(msg);
  }

  var submitForm = function(email){
    $.post('/signup', {email : email}, function(message){
      submissionComplete(message);
    });
    $('form').fadeOut().remove()
  }

  $('form').submit(function(){
    if((new Date()).getTime() - start < 1200){
      return false ;
    }
    
    var email = $('input[name=email]').val();
    if(email === ''){
      alert('Email is blank, please fill it in!');
    }else{
      submitForm(email);
    }
    return false;
  })
})