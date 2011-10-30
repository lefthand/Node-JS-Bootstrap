$(document).ready(
  function(){
    $('#postForm').validate({
      rules:{
        email_address:{
          remote: {
            url:'/post/validate/email/',
            type:'post'
          }
        }
      }
    });
  }
)
