  let eventFormError = false;
jQuery(document).ready(function () {

  jQuery('.register_for_free').on('click', function(){ console.log('mmmmm')
    jQuery('.event_popup_overlay').addClass('active');
    jQuery('body').addClass('scroll_disclaimer');
    return false;
  });

  jQuery('.event_popup_overlay .close, .event_popup_overlay').on('click', function(){
    jQuery('.event_popup_overlay').removeClass('active');
    jQuery('body').removeClass('scroll_disclaimer');
  });
  jQuery('.event_popup_content').on('click', function(e){
    e.stopPropagation();
  });
  jQuery('.tenweb-input').keyup(function () {
    checkFields(jQuery(this), 'keyup');
  });
  jQuery('.tenweb-input').change(function () {
    checkFields(jQuery(this), 'change');
  });

  jQuery('.event_button').on("click", function () {
    let _this = jQuery(this);
    jQuery('.tenweb-input').each(function (i, el) {
      checkFields(jQuery(el), 'click');
    })

    if (!eventFormError) {
      _this.addClass('loading');
      jQuery('#google_calendar').attr('data-email', jQuery('#email').val());
      let formData = new FormData();
      formData.append('email', jQuery("#email").val());
      formData.append('first_name', (jQuery("#first-name").val()).trim());
      formData.append('last_name', (jQuery("#last-name").val()).trim());

      fetch("https://core.10web.io/api/hubspot/send-data", {
        method: 'POST',
        headers: {
          'Accept': 'application/x.10webcore.v1+json'
        },
        body: formData,
      })
        .then(response => response.json())
        .then(result => { console.log(result);
          if (result.status === "ok") {
            jQuery('.event_popup_content').addClass('after_submit');
          } else {
            console.log("Error");
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
    return false;
  });
});



function validateEmail(email) {
  let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function checkFields(_this, event) {
  const namePatt = /[-a-zA-Z0-9@:%_+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&\/=]*)?/;
  let error = false,
    _thisTrimmed = _this.val().trim(),
    errorMsg = '',
    group =  _this.closest(".column");
  if (_thisTrimmed === "") {
    group.removeClass("error");
  }
  switch (_this.attr("id")) {
    case "first-name":
      if (_thisTrimmed === "") {
        error = true;
        errorMsg = 'First name is required';
      }
      else if (_thisTrimmed.match(namePatt)) {
        error = true;
        errorMsg = 'First name should not contain URL';
      }
      break;
    case "last-name":
      if (_thisTrimmed === "") {
        error = true;
        errorMsg = 'Last name is required';
      }
      else if (_thisTrimmed.match(namePatt)) {
        error = true;
        errorMsg = 'Last name should not contain URL';
      }
      break;
    case "email":
      if (_thisTrimmed === "") {
        error = true;
        errorMsg = 'Email address is required';
      }
      else if (!validateEmail(_thisTrimmed)) {
        error = !(!group.hasClass("error") && event === 'keyup');
        errorMsg = error ? 'Please enter a valid email' : '';
      }
      break;
  }
  if (error) {
    group.addClass("error");
    group.find(".event-error").html(errorMsg).attr("data-msg", errorMsg).addClass('show');
  } else {
    group.removeClass("error");
    group.find(".event-error").html('').removeClass('show');
  }
  if (jQuery(".column.error").length) {
    jQuery('.event_button').prop('disabled', true).addClass("button_disabled");
    eventFormError = true;
  }
  else {
    jQuery('.event_button').prop('disabled', false).removeClass("button_disabled");
    eventFormError = false;
  }
}
