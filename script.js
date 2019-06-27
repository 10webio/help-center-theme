/*
 * jQuery v1.9.1 included
 */
$(document).ready(function() {
  if ($('.category-container').length) {
    if ($('.category-container .page-header h1').text() == 'Plugins') {
      $('.featured_plugin').show();
    }
  }
  
  if (!$('section.section.hero').length) {
    $('body').addClass('black_menu');
    $(".header .logo img").attr("src", $(".header .logo img").data("fixed_img"));
  }
  
  $(".blocks-item").has("a[href$='/hc/en-us/categories/360001741252-10Web-Platform-information']").hide();
  $(".section-articles ul").has("a[href$='/hc/en-us/articles/360028017772-Public-roadmap']").parent().parent().hide()
  // social share popups
  $(".share a").click(function(e) {
    e.preventDefault();
    window.open(this.href, "", "height = 500, width = 500");
  });
 
  // show form controls when the textarea receives focus or backbutton is used and value exists
  var $commentContainerTextarea = $(".comment-container textarea"),
    $commentContainerFormControls = $(".comment-form-controls, .comment-ccs");

  $commentContainerTextarea.one("focus", function() {
    $commentContainerFormControls.show();
  });
  if ($commentContainerTextarea.val() !== "") {
    $commentContainerFormControls.show();
  }

  // Expand Request comment form when Add to conversation is clicked
  var $showRequestCommentContainerTrigger = $(".request-container .comment-container .comment-show-container"),
    $requestCommentFields = $(".request-container .comment-container .comment-fields"),
    $requestCommentSubmit = $(".request-container .comment-container .request-submit-comment");

  $showRequestCommentContainerTrigger.on("click", function() {
    $showRequestCommentContainerTrigger.hide();
    $requestCommentFields.show();
    $requestCommentSubmit.show();
    $commentContainerTextarea.focus();
  });

  // Mark as solved button
  var $requestMarkAsSolvedButton = $(".request-container .mark-as-solved:not([data-disabled])"),
    $requestMarkAsSolvedCheckbox = $(".request-container .comment-container input[type=checkbox]"),
    $requestCommentSubmitButton = $(".request-container .comment-container input[type=submit]");

  $requestMarkAsSolvedButton.on("click", function () {
    $requestMarkAsSolvedCheckbox.attr("checked", true);
    $requestCommentSubmitButton.prop("disabled", true);
    $(this).attr("data-disabled", true).closest("form").submit();
  });

  // Change Mark as solved text according to whether comment is filled
  var $requestCommentTextarea = $(".request-container .comment-container textarea");

  $requestCommentTextarea.on("keyup", function() {
    if ($requestCommentTextarea.val() !== "") {
      $requestMarkAsSolvedButton.text($requestMarkAsSolvedButton.data("solve-and-submit-translation"));
      $requestCommentSubmitButton.prop("disabled", false);
    } else {
      $requestMarkAsSolvedButton.text($requestMarkAsSolvedButton.data("solve-translation"));
      $requestCommentSubmitButton.prop("disabled", true);
    }
  });

  // Disable submit button if textarea is empty
  if ($requestCommentTextarea.val() === "") {
    $requestCommentSubmitButton.prop("disabled", true);
  }

  // Submit requests filter form in the request list page
  $("#request-status-select, #request-organization-select")
    .on("change", function() {
      search();
    });

  // Submit requests filter form in the request list page
  $("#quick-search").on("keypress", function(e) {
    if (e.which === 13) {
      search();
    }
  });

  function search() {
    window.location.search = $.param({
      query: $("#quick-search").val(),
      status: $("#request-status-select").val(),
      organization_id: $("#request-organization-select").val()
    });
  }

  function toggleNavigation(toggleElement) {
    var menu = document.getElementById("user-nav");
    var isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggleElement.setAttribute("aria-expanded", !isExpanded);
  }

  $(".header .icon-menu").on("click", function(e) {
    e.stopPropagation();
    toggleNavigation(this);
  });

  $(".header .icon-menu").on("keyup", function(e) {
    if (e.keyCode === 13) { // Enter key
      e.stopPropagation();
      toggleNavigation(this);
    }
  });

  $("#user-nav").on("keyup", function(e) {
    if (e.keyCode === 27) { // Escape key
      e.stopPropagation();
      this.setAttribute("aria-expanded", false);
      $(".header .icon-menu").attr("aria-expanded", false);
    }
  });

  if ($("#user-nav").children().length === 0) {
    $(".header .icon-menu").hide();
  }

  // Submit organization form in the request page
  $("#request-organization select").on("change", function() {
    this.form.submit();
  });

  // Toggles expanded aria to collapsible elements
  $(".collapsible-nav, .collapsible-sidebar").on("click", function(e) {
    e.stopPropagation();
    var isExpanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", !isExpanded);
  });

scrolled = 0;
    $(window).scroll(function(e){
        var scroll = $(window).scrollTop();
        var breadcrumbs = $("nav.sub-nav").length;
        var height = breadcrumbs ? ($("nav.sub-nav").position().top + 100) : ( $(".hero").outerHeight(true) - 71);
        if (!matchMedia('screen and (max-width: 767px)').matches) {
          if($('section.section.hero').length) {
              if (scroll > 100) {
                $(".header").addClass("active");
              } else {
                $(".header").removeClass("active");
              }
              if (scroll > (height)) {
                var fixed_img = $(".header .logo img").data("fixed_img");
                $(".header .logo img").attr("src", fixed_img);
                $(".header").addClass("fixed_header");

                if (breadcrumbs && scrolled == 0) { 
                  scrolled = 1;
                  $(".sub_nav_search .search.search-full").after($("ol.breadcrumbs:not(.search-result-breadcrumbs)")); 
                  $(".sub_nav_search").css({
                     'display':'block',
                  });
                }
              } else {
                  var img = $(".header .logo img").data("img");
                  $(".header .logo img").attr("src", img);
                  $(".header").removeClass("fixed_header");
                  if (breadcrumbs && scrolled == 1) {
                    scrolled = 0;
                    $("nav.sub-nav").append($("ol.breadcrumbs:not(.search-result-breadcrumbs)"));
                   $(".sub_nav_search").css({
                        'display':'none',
                    });
                  }
              }
           } else {
             if (scroll > (height)) {
              

                if (breadcrumbs && scrolled == 0) { 
                  scrolled = 1;
                  $(".sub_nav_search .search.search-full").after($("ol.breadcrumbs:not(.search-result-breadcrumbs)")); 
                  $(".sub_nav_search").css({
                     'display':'block',
                  });
                }
              } else {
                  if (breadcrumbs && scrolled == 1) {
                    scrolled = 0;
                    $("nav.sub-nav").prepend($("ol.breadcrumbs:not(.search-result-breadcrumbs)"));
                   $(".sub_nav_search").css({
                        'display':'none',
                    });
                  }
              }
           }
        }
    })

});
