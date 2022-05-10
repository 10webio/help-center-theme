/**
 * jQuery v1.9.1 included
 */
const helpCenterEndpoint = "https://help.10web.io/api/v2/help_center/";
const helpCenterLink = "https://help.10web.io/hc/en-us/";
const myDomain = "https://my.10web.io/";
const mainSections = {
    "4403735323410" : {
        "name" : "Getting Started",
        "custom" :
          [
              {
                  "id":"4408397419538",
                  "type":"article"
              }
          ]
    },
    "4403729393554":{
        "name" : "Automated WP Platform",
        "custom" :
          [
              {
                  "id":"4403735372178",
              },
              {
                  "id":"4403729648146",
              },
              {
                  "id":"4403729668754",
              },
              {
                  "id":"4403729675538",
              }
          ]
    },
    "4403729943442":{
        "name" : "10Web Builder",
        "custom" :
          [
              {
                  "id":"4403730815122",
              },
              {
                  "id":"4403735907986",
              }
          ]
    },
    "4403736661266":{
        "name" : "Account & Payment",
        "custom" :
          []
    },
    "4403730877330":{
        "name" : "Plugins",
        "custom" :
          [
              {
                  "id":"4403731132434",
              },
              {
                  "id":"4403736802706",
              },
              {
                  "id":"4403731164306",
              }
          ]
    },
    "4403731365906":{
        "name" : "Troubleshooting",
        "custom" :
          [
              {
                  "id":"4403731580946",
              }
          ]
    }
};

const helpAPI = {
    getSections : function() {
        let results = {};
        $.ajax({
            url: `${helpCenterEndpoint}sections?per_page=200`,
            type: 'get',
            async: false,
            success: function (data) {
                results = data;
            }
        });
        return results;
    },

    getSection : function(id) {
        let results = {};
        $.ajax({
            url: `${helpCenterEndpoint}sections/${id}`,
            type: 'get',
            async: false,
            success: function (data) {
                results = data;
            }
        });
        return results;
    },

    getArticlesBySectionId : function(sectionId) {
        let result = {},
            results = [],
            articles = [];
        $.ajax({
            url: `${helpCenterEndpoint}/sections/${sectionId}/articles?per_page=100`,
            type: 'get',
            async: false,
            success: function (data) {
                result = data;
            }
        });
        results = result.articles;

        /**
         * Add to section another article which used in another section
         */
        let section = helpAPI.getSection(sectionId);
        if (section.section && section.section.description) {
            articles = JSON.parse(section.section.description);
            if (articles.length) {
                for (let i = 0; i < articles.length; i++) {
                    results.push({
                        id: articles[i]['id'],
                        name: articles[i]['name'],
                        html_url: articles[i]['html_url']
                    });
                }
            }
        }
        return results;
    },

    getArticleById : function(articleId) {
        let results = {};
        $.ajax({
            url: `${helpCenterEndpoint}articles/${articleId}`,
            type: 'get',
            async: false,
            success: function (data) {
                results = data;
            }
        });
        return results;
    }
};

Object.keys(redirection_list).map( function(key) {
    if ( redirection_list[key].includes(window.location.href) ) {
        window.location.replace( key );
    }
});

$(document).ready(function() {
    /**
     * Add tracking to hire an expert link
     */
    jQuery(".hire_an_expert").on("click",function () {
        dataLayer.push({
            event: '10web-event',
            'eventCategory': 'Experts',
            'eventAction': "Hire an Expert - Help Center footer",
            'eventLabel' : window.location.href
        });
    });
    jQuery('.copy_container').on('click', function () {
        if (!jQuery(this).hasClass('copied')) {
            const el = this;
            setTimeout(function() {
                jQuery('.copy_container').removeClass('copied');
                jQuery('.copy_container span').html('Copy');
            }, 700);
            copyToClipboard(jQuery('#coupon_code'));
            jQuery(this).addClass('copied');
            jQuery('.copy_container span').html('Copied');
        }
    });


    let pageInfo = getPageInfo(window.location.href);

    /**
    * Video Tutorial Page(article)
    */
    let currentId = pageInfo.id;
    if ( currentId === '4408397419538') {
        $('.hero-inner .header_title').text('Video Tutorials').show();
        $('.hero-inner .header_desc').text('Visual guides to help you every step of the way.').show();
        $('.breadcrumbs li[title="Video Tutorials"]').css('pointer-events','none');
    }
    else {
        $('.hero-inner .header_title,.hero-inner .header_desc').show();
    }


    article_titles();

    /**
     * Glossary article
     * */
    let html = '';
    let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for (let i =  0; i < letters.length; i++) {
        html += '<li><a href="#' + letters[i] + '">' + letters[i] + '</a><span>|</span></li>';
    }
    jQuery('.glossary-letters').html(html);

    jQuery('.glossary-letters a').on("click",function (a) {
        let el = jQuery(jQuery(this).attr('href'));
        if( el.length ) {
            jQuery('html, body').animate({scrollTop: (jQuery(el).offset().top - 125)}, 500);
        }
    });

    /**
     * Remove same title from breadcrumbs
     * */
    if (pageInfo.type && (pageInfo.type === "articles" || pageInfo.type.includes("search?"))) {
        let same = [];
        $('.breadcrumbs li').each(function(i, e){
            let text = $(this).text().toLowerCase();
            if( $.inArray(text, same) > -1 ) {
                $(this).remove();
            } else {
                same.push( text );
            }
            /**
             * Remove section link in the breadcrumbs
             */
            if($(this).find('a').length){
                let link = $(this).find('a').attr('href'),
                    linkText = $(this).find('a').text();
                if(link.indexOf('/en-us/sections/') !== -1){
                    $(this).html(`<span>${linkText}</span>`);
                }
            }
        });
    }

    /**
     * Add vote up and down message
      */
    $(".article-vote-up").on('click', function() {
        $(this).addClass("active").removeClass("deactive");
        $(".article-vote-down").addClass("deactive").removeClass("active");
    });
    $(".article-vote-down").on('click', function() {
        $(this).addClass("active").removeClass("deactive");
        $(".article-vote-up").addClass("deactive").removeClass("active");
    });

    setMenu();
    setFixedMenu();
    mobileMenuItems();
    if ($('.user_info_section .login').length) {
        $('.user_info_section .login').text('Sign Up');
    }

    /**
    * Go To Section
    */

    if ( pageInfo.type === "categories" && pageInfo.sectionId !== 0) {
        goToSection('#' + pageInfo.sectionId);
        removeHashFromUrl();
    }
    $('#categories-menu .container > ul > li ul a').click(function () {
        let id = $(this).attr("href");
        goToSection(id);
        return false;
    });
    $('.article-list:not(.category-list) > li a').click(function () {
        if ($(this).attr('href') != "") {
            window.location.href = $(this).attr('href');
        }
        return false;
    });


    /**
     * Zendesk chat
     * */
    setTimeout(function () {
        $("#advanced_chat").fadeIn('slow');
        $(".chats-container, #advanced_chat").removeAttr("style");
    }, 100);

    $(".resource_item.contact_us, .advanced_chat-bubble").on('click', function(){
        if( typeof zE != 'undefined' && zE('webWidget:get', 'chat:isChatting') ) {
            zE('webWidget', 'show');
            zE('webWidget', 'open');
        }
        else {
            $(".chats-chat-name").toggleClass('chats-chat-name-opened');
            tenweb_openZEChat();
        }

        return false;
    });


    function tenweb_openZEChat() {
        if ( jQuery( '#ze-snippet' ).length === 0 ) {
            tenweb_init_ZE();
        }
        else {
            if ( typeof zE != 'undefined' ) {
                zE('webWidget', 'show');
                zE('webWidget', 'open');
            }
        }
    }

    function openZEChatCallback() {
        $("#advanced_chat-bubble").removeClass( 'hidden' );
        zE('webWidget:on', 'chat:unreadMessages', function(number) {
            if (number > 0) {
                zE('webWidget', 'show');
                zE('webWidget', 'open');
            }
        });
        zE('webWidget:on', 'open', function() {
            $('#advanced_chat').hide();
        });
        zE('webWidget:on', 'close', function() {
            zE('webWidget', 'hide');
            $('#advanced_chat').show();
        });
        zE('webWidget:on', 'chat:connected', function() {
            zE('webWidget', 'show');
            zE('webWidget', 'open');
        });
        zE('webWidget', 'setLocale', 'en');
    }

    function tenweb_init_ZE() {
        if ( jQuery( '#ze-snippet' ).length === 0) {
            tenweb_loadScript( 'https://static.zdassets.com/ekr/snippet.js?key=1b7006ee-2237-41f9-a143-958f11bc68b5', 'ze-snippet', function () {
                window.zESettings = {
                    webWidget: {
                        chat: {
                            suppress: false,
                            tags: ['generic_support']
                        }
                    }
                };
                openZEChatCallback();
            } );
        }
    }

    function tenweb_loadScript( src, id, callback ) {
        if ( $( '#' + id ).length == 0 ) {
            let script = document.createElement( 'script' );
            script.setAttribute( 'src', src );
            script.setAttribute( 'id', id );
            script.addEventListener( 'load', callback );
            document.head.appendChild( script );
        }
    }



    /**
     * Video
     * */
    $(".play_button").click(function (e) {
        e.preventDefault();
        showPopup(e, 'YT');
        const script = document.createElement('script');
        script.src = "https://www.youtube.com/player_api";
        document.getElementsByTagName('head')[0].appendChild(script);
        const tenWebPluginVideoId = $(this).data("id");
        const script_load_interval = setInterval(function () {
            if (typeof YT !== "undefined") {
                window.YT.ready(function() {
                    new YT.Player('iframe-container', {
                        height: '675',
                        width: '1200',
                        videoId: tenWebPluginVideoId,
                        playerVars: {
                            autoplay: 1,
                            loop: 1,
                            modestbranding: 1,
                            vq: 'hd2160',
                            rel: 0,
                            showinfo: 0,
                            cc_load_policy: 0,
                            iv_load_policy: 3
                        }
                    });
                });
                clearInterval(script_load_interval);
            }
        }, 100);
    });


    /**
     * Popup
     * */
    $(".article-body img, .article-body video").click(function (e) {
        e.preventDefault();
        showPopup(e, 'popup');
    });

    if ($('.user_info_section #user').length) {
        $('body').addClass("logged-in");
    }
    else {
        $('body').addClass("logged-out");
    }

    $(".user-info").on("click", function(e) {
        e.stopPropagation();
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
        }
        else {
            $(this).addClass('active');
        }
    });
    $("body").on("click", function(e) {
        $(".user-info").removeClass('active');
    });

    if (matchMedia('screen and (max-width: 767px)').matches) {
        $(".container_questions .q_title").click(function(e) {
            $(this).toggleClass("active");
            $(this).closest(".question_section").find(".q_desc").toggle();
        });
    }

    if ($('.category-container').length) {
        if ($('.category-container .page-header h1').text() == 'Plugins') {
            $('.featured_plugin').show();
        }
    }

    if (!$('.hero-inner .search').length) {
        if(matchMedia('screen and (min-width: 767px)').matches){
            $('body').addClass('black_menu');
        }
        $('body').addClass('with_search');
    }

    $(".blocks-item").has("a[href$='/hc/en-us/categories/360001741252-10Web-Platform-information']").hide();
    $(".section-articles ul").has("a[href$='/hc/en-us/articles/360028017772-Public-roadmap']").parent().parent().hide()

    /**
     * Social share popups
      */
    $(".share a").click(function(e) {
        e.preventDefault();
        window.open(this.href, "", "height = 500, width = 500");
    });

    /**
     * Show form controls when the textarea receives focus or back button is used and value exists
      */
    const $commentContainerTextarea = $(".comment-container textarea"),
      $commentContainerFormControls = $(".comment-form-controls, .comment-ccs");

    $commentContainerTextarea.one("focus", function() {
        $commentContainerFormControls.show();
    });
    if ($commentContainerTextarea.val() !== "") {
        $commentContainerFormControls.show();
    }

    /**
     * Expand Request comment form when Add to conversation is clicked
      */
    const $showRequestCommentContainerTrigger = $(".request-container .comment-container .comment-show-container"),
      $requestCommentFields = $(".request-container .comment-container .comment-fields"),
      $requestCommentSubmit = $(".request-container .comment-container .request-submit-comment");

    $showRequestCommentContainerTrigger.on("click", function() {
        $showRequestCommentContainerTrigger.hide();
        $requestCommentFields.show();
        $requestCommentSubmit.show();
        $commentContainerTextarea.focus();
    });

    /**
     * Mark as solved button
      */
    const $requestMarkAsSolvedButton = $(".request-container .mark-as-solved:not([data-disabled])"),
      $requestMarkAsSolvedCheckbox = $(".request-container .comment-container input[type=checkbox]"),
      $requestCommentSubmitButton = $(".request-container .comment-container input[type=submit]");

    $requestMarkAsSolvedButton.on("click", function () {
        $requestMarkAsSolvedCheckbox.attr("checked", true);
        $requestCommentSubmitButton.prop("disabled", true);
        $(this).attr("data-disabled", true).closest("form").submit();
    });

    /**
     * Change mark as solved text according to whether comment is filled
     */
    const $requestCommentTextarea = $(".request-container .comment-container textarea");

    $requestCommentTextarea.on("keyup", function() {
        if ($requestCommentTextarea.val() !== "") {
            $requestMarkAsSolvedButton.text($requestMarkAsSolvedButton.data("solve-and-submit-translation"));
            $requestCommentSubmitButton.prop("disabled", false);
        } else {
            $requestMarkAsSolvedButton.text($requestMarkAsSolvedButton.data("solve-translation"));
            $requestCommentSubmitButton.prop("disabled", true);
        }
    });

    /**
     * Disable submit button if textarea is empty
     */
    if ($requestCommentTextarea.val() === "") {
        $requestCommentSubmitButton.prop("disabled", true);
    }

    /**
     * Submit requests filter form in the request list page
     */
    $("#request-status-select, #request-organization-select")
      .on("change", function() {
          search();
      });

    /**
     * Submit requests filter form in the request list page
     */
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

    $(".header .menu-icon").on("click", function(e) {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            if (($('.hero-inner .search').length || matchMedia('screen and (max-width:767px)').matches) && !$('body').hasClass('fixed_header') )  {
                $("body").removeClass("black_menu");
            }
            $("body, html").removeClass("menu_opened");
        }
        else {
            $(this).addClass('active');
            $('body').addClass('black_menu').addClass("menu_opened");
            $('html').addClass("menu_opened");
        }
    });

    $("#user-nav").on("keyup", function(e) {
        if (e.keyCode === 27) { // Escape key
            e.stopPropagation();
            this.setAttribute("aria-expanded", false);
            $(".header .icon-menu").attr("aria-expanded", false);
        }
    });

    /**
     * Submit organization form in the request page
     */
    $("#request-organization select").on("change", function() {
        this.form.submit();
    });

    /**
     * Toggles expanded aria to collapsible elements
     */
    $(".collapsible-nav, .collapsible-sidebar").on("click", function(e) {
        e.stopPropagation();
        let isExpanded = this.getAttribute("aria-expanded") === "true";
        this.setAttribute("aria-expanded", !isExpanded);
    });

    $("footer .footer_widget_nav_menu .footer_titles").click(function () {
        if (matchMedia('screen and (max-width: 1279px)').matches) {
            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
                $(this).next("div").slideUp("fast");
            }
            else {
                $(this).addClass("active");
                $(this).next("div").slideDown("fast");
            }
        }
    });

    $(".header_container .toggle-search").click(function () {
        $('.header_container .header_search').addClass('active_search');
    });

    $(".header_container .icon-close").click(function () {
        $('.header_container .header_search').removeClass('active_search');
    });
    $(".article-body .accordion-section .dropdown-article").click( function() {
        $(this).parent().toggleClass("active");
        $(this).next('.accordion-container').slideToggle(50);
        $(this).parent().find('.accordion-section').removeClass('active');
        $(this).parent().find('.accordion-section .accordion-container').hide();
    });

    let $temp = $("<input>");
    let $url = $(location).attr('href');

    $('.clipboard').on('click', function() {
        $("body").append($temp);
        $temp.val($url).select();
        document.execCommand("copy");
        $temp.remove();
        $(".clipboard-link .clipboard").text("Copied");
        setTimeout(function() {
            $(".clipboard-link .clipboard").text("Copy article URL");
        },2000);

    });

    click = false;
    $(".article-sidebar li").on('click', function() {
        let links = $(".article-body").find("h2"),
            i = $(this).index();
        $(".article-sidebar li").removeClass("active");
        $(this).addClass("active");
        click = true;
        $('html, body').animate({
            scrollTop: links.eq(i).offset().top - 130
        }, 500, function(){
            click = false;
        });
    });

    $(window).scroll(function(e) {
        setFixedMenu();
        if ($('.user-info.dropdown').length) {
            $('.user-info.dropdown').removeClass('active');
            $('#user-dropdown').attr('aria-expanded',false).removeClass('dropdown-menu-end');
        }

        if ($(".article-sidebar.desktop-sidebar").length) {
            let links = $(".article-body").find("h2"),
                sTop = $(window).scrollTop();
            if(links.length && !click) {
                $(links).each(function (index, el) {
                    if(links.eq(index + 1).length){
                        if (sTop > $(el).offset().top - 135 && sTop < links.eq(index + 1).offset().top - 135) {
                            highlightInThisArticle(index);
                        }
                    } else {
                        if (sTop > $(el).offset().top - 135) {
                            highlightInThisArticle(index);
                        }
                    }
                });
                if(sTop + $(window).height() == $(document).height()){
                    highlightInThisArticle(links.length-1);
                }
            }
        }
    });

    $(".categories-menu_current").on('click', function() {
        if($(this).closest("#categories-menu").hasClass("opened")){
            $(this).closest("#categories-menu").removeClass("opened");
        }
        else {
            $(this).closest("#categories-menu").addClass("opened");
        }
    });
});

function highlightInThisArticle(index) {
    let items = jQuery(".desktop-sidebar .sticky-sidebar").find("li"),
      currentItem = items.eq(index);
    items.removeClass("active");
    currentItem.addClass("active");
    if (!checkInView(currentItem)) {
        jQuery(".desktop-sidebar .sticky-sidebar").scrollTo(currentItem, 12);
    }
}

function checkInView(elem,partial) {
    let container = jQuery(".desktop-sidebar .sticky-sidebar"),
      contHeight = container.height(),
      elemTop = jQuery(elem).offset().top - container.offset().top,
      elemBottom = elemTop + jQuery(elem).height(),
      isTotal = (elemTop >= 0 && elemBottom <=contHeight),
      isPart = ((elemTop < 0 && elemBottom > 0 ) || (elemTop > 0 && elemTop <= container.height())) && partial;

    return  isTotal  || isPart ;
}

jQuery.fn.scrollTo = function(elem, speed) {
    jQuery(this).animate({
        scrollTop:  jQuery(this).scrollTop() - jQuery(this).offset().top + elem.offset().top
    },  speed);
    return this;
};


function article_titles(){
    let links = $(".article-body").find("h2");
    if($(links).length) {
        $('.article-sidebar.desktop-sidebar').toggleClass('desktop-active');
        $('.article-sidebar.mobile-sidebar').toggleClass('mobile-active');
        let ul = "<ul>";
        for(let i = 0; i < links.length; i++){
            let el_class = (i == 0) ? "active" : "";
            ul += "<li class='" + el_class + "'>";
            ul += links.eq(i).html() + "</li>";
        }
        ul += "</ul>";
        $(".sticky-sidebar").html(ul);
    }
}

$(window).on("resize", function () {
    mobileMenuItems();

    if ($('.footer_widget_nav_menu > div').length) {
        if (matchMedia('screen and (min-width: 1260px)').matches) {
            $('.footer_widget_nav_menu > div').show();
        }
        else {
            $('.footer_widget_nav_menu > div').hide();
            $("footer .footer_widget_nav_menu .footer_titles").removeClass("active");
        }
    }
});

document.addEventListener("DOMContentLoaded", function() {
    let yearSpan = document.querySelector('.full_year'),
        date = new Date().getFullYear();
    yearSpan.textContent = date;
});

function showPopup(e, type) {

    const videoContainer = '<div id="embed_container">' +
      '<div><div class="close_embed screen"></div>' +
      '<div class="iframe-container-latest">' +
      '<div id="iframe-container"></div>' +
      '</div>' +
      '</div>' +
      '</div>';
    $('body').append(videoContainer);

    if (type === 'popup') {
        $('#iframe-container').html(e.target.outerHTML);
        if (e.target.tagName === 'IMG') {
            $('#iframe-container img').removeAttr('srcset');
        }
        $('#embed_container').addClass(e.target.tagName);
    }

    $("#embed_container").show();

    $('#embed_container,.close_embed').click( function (a) {
        $("#embed_container").hide();
        $('.iframe-container-latest iframe').remove();
        $('.iframe-container-latest').html("<div id='iframe-container'></div>");
    });
}

function getPageInfo(link) {
    let t = link.split('/hc/');
    t = t[1].split('-')[1].split('/');
    t[3] = 0;
    if (t[2] && t[2].indexOf('#') != -1) {
        t[3] = t[2].split('#')[1];
        t[2] = t[2].split('#')[0];
    }
    return {type:t[1], id:t[2], sectionId:t[3]};
}


function mobileMenuItems() {
    if (matchMedia('screen and (max-width: 767px)').matches) {
        if ($('.user_info_section #user').length) {
            $('.mobile-menu-logged-in .container').prepend($('.user_info_section'));
        }
        else {
            $('.mobile-menu-logged-out').prepend($('.user_info_section'));
        }
    }
    else {
        $('.header_search').after($('.user_info_section'));
    }
}

function setFixedMenu() {
    let scroll = $(window).scrollTop();
    const height =  $(".hero").outerHeight();
    if (!$("body").hasClass('menu_opened')) {
        if (scroll > 400) {
            $("body").addClass("active_fixed");
        } else {
            $("body").removeClass("active_fixed");
        }
        if (scroll > height + 100) {
            $("body").addClass("black_menu").addClass("fixed_header");
        } else {
            $("body").removeClass("fixed_header");
            if ($('.hero-inner .search').length || matchMedia('screen and (max-width: 767px)').matches) {
                $("body").removeClass("black_menu");
            }
        }
    }
}



const categoryPage = {
    categoryId : 0,
    section : {},
    setSection : function(id) {
        this.categoryId = id;
        if (mainSections.hasOwnProperty(id)) {
            this.section = mainSections[id];
        }
    },

    setCategoryPageSections : function(type, list, section) {
        /**
         * Set all articles in sections
         * */

        let html = "";
        if ( list.length) {
            let ulClass = type === "categories" ? " category-list" : "";
            html += "<ul class='article-list " + ulClass + "'>";
            for (let i = 0; i < list.length; i++) {
                if (type === "categories") {
                    html += "<li><a href='" + helpCenterLink + "categories/" + list[i].id + "'>" + list[i].name + "</a></li>";
                } else {
                    let existsInRedirectionList = false;
                    for (const property in redirection_list) {
                        if (redirection_list[property].includes(list[i].html_url)) {
                            existsInRedirectionList = true;
                            break;
                        }
                    }
                    if (!existsInRedirectionList) {
                        html += "<li><a href='" + list[i].html_url + "'>" + list[i].name + "</a></li>";
                    }
                }

            }
            html += "</ul>";
        }
        $(section).find('.article-list').replaceWith(html);
    },


    setCategoryPageCustomArticle : function(article) {
        let html = "<section class='section article'>" +
          "<h3 class='section-tree-title'>" + article.name + "</h3>" +
          "<div>" + article.body + "</div></section>";

        $(".section-tree").prepend(html);
    },

    getCategorySections : function(id) {
        this.setSection(id);
        let _this = this,
          staticSection = _this.section;
        $('.section-tree-with-article').removeAttr('data-asynchtml');

        /**
         * Main Categories
         * */
        if (staticSection && Object.keys(staticSection).length !== 0) {
            $('.categories-page').addClass("main-categories");

            /**
             * Videos section
             * */
            if (staticSection.name === "Getting Started") {
                let customArticle = staticSection.custom.find(function(el, i) {
                    if(el.type === 'article')
                        return true;
                });
                if (customArticle.id) {
                    let article =  helpAPI.getArticleById(customArticle.id);
                    if (article.article) {
                        _this.setCategoryPageCustomArticle(article.article);
                    }

                }
            }

            /**
             * Custom section with categories
             * */
            $(".categories-page .section-tree .section[data-id]").each(function(index, _section){
                let sectionId = $(this).data("id");
                custom = staticSection.custom.find(function(el, i) {
                    if(el.id == sectionId)
                        return true;
                });
                if (custom) {
                    customSection = helpAPI.getSection(sectionId);
                    if (customSection.section) {
                        let categories = JSON.parse(customSection.section.description);
                        _this.setCategoryPageSections("categories", categories, _section);
                    }
                }
                else {
                    let articles = helpAPI.getArticlesBySectionId(sectionId);
                    if ( articles && articles.length ) {
                        _this.setCategoryPageSections("articles", articles, _section)
                    }
                }
            });
        }
        else {
            $('.categories-page').addClass("other-categories");
            if($('.categories-page .section-tree .section').length > 1){
                $('.categories-page .section-tree .section > h2').show();
            }
            $(".categories-page .section-tree .section[data-id]").each(function(index, _section){
                let sectionId = $(this).data("id");
                let articles = helpAPI.getArticlesBySectionId(sectionId);
                if ( articles && articles.length ) {
                    _this.setCategoryPageSections("articles", articles, _section)
                }
            });
        }
    }
}


function setMenu() {
    let menu = {},
      html = "",
      link = "",
      pageInfo = getPageInfo(window.location.href),
      currentId = pageInfo.id,
      allSections = helpAPI.getSections();
    if (allSections.count) {
        for (const id in mainSections) {
            menu[id] = {};
            menu[id].name = mainSections[id].name;
            menu[id].sections = allSections.sections.filter(function(el, i) {
                if(el.category_id == id)
                    return true;
            });
        }
    }
    let currentName = (mainSections.hasOwnProperty(currentId)) ? mainSections[currentId].name : mainSections[Object.keys(mainSections)[0]].name;
    html += "<div class='container'><div class='categories-menu_current'>" + currentName + "</div><ul>";
    for (const property in menu) {
        let currentItem = property === currentId ? "class='current-item'" : "";
        html += "<li " + currentItem + " data-id='" + property + "'><a href='" + helpCenterLink + "categories/" + property + "'>" + menu[property]["name"] + "</a>";
        if (menu[property]["sections"].length) {
            html += "<div class='submenu-overflow'><ul>";
            for (let i = 0; i < menu[property]["sections"].length; i++) {
                if (property !== currentId) {
                    link = helpCenterLink + "categories/" + property + "#section_" + menu[property]["sections"][i]["id"];
                }
                else {
                    link = "#section_" + menu[property]["sections"][i]["id"];
                }
                html += "<li><a href='" + link + "'>" + menu[property]["sections"][i]["name"] + "</a></li>";
            }
            html += "</ul></div>";
        }
        html += "</li>";
    }
    html += "</ul></div>"

    if ($("#categories-menu").length) {
        $("#categories-menu").html(html);
    }
    $("#mobile-menu .mobile-menu-container").html(html);


    /**
     * Set current category and breadcrumbs item
     * */
    isCurrentCategory(allSections)
}

function  isCurrentCategory(allSections) {
    if ($(".breadcrumbs-nav").length && $(".breadcrumbs-nav").is(':visible')) {
        let link = $(".breadcrumbs-nav .breadcrumbs > li:nth-child(2) a").length ? $(".breadcrumbs-nav .breadcrumbs > li:nth-child(2) a").attr('href') : window.location.href,
          pageInfo = getPageInfo(link),
          categoryId = pageInfo.id;
        if (allSections.count) {
            let parentSection = allSections.sections.filter(function(el, i) {
                if(el.description.includes(categoryId))
                    return true;
            });
            if (parentSection.length) {
                let parentCategoryId = parentSection[0].category_id;
                /**
                 * Set current class to parent category
                 * */
                if ($('#categories-menu li[data-id=' + parentCategoryId + ']').length) {
                    $('#categories-menu li[data-id=' + parentCategoryId + ']').addClass('current-item');
                }

                /**
                 * Add parent category item to breadcrumbs
                 * */
                if ($('.breadcrumbs-nav').length) {
                    if (mainSections.hasOwnProperty(parentCategoryId)) {
                        let parentCategoryName = mainSections[parentCategoryId].name;
                        let item = '<li title="' + parentCategoryName + '"><a href="' + helpCenterLink + 'categories/' + parentCategoryId + '">' + parentCategoryName + '</a></li>';
                        $(".breadcrumbs-nav .breadcrumbs > li:first-child").after(item);
                    }
                }
            }
        }
    }
}

function goToSection(id) {
    let sectionIndex = $(id).index();
    $("html, body").animate({scrollTop: ($(id).offset().top - 120)}, 500);
}

function removeHashFromUrl()
{
    let uri = window.location.toString();
    if (uri.indexOf("#") > 0) {
        let clean_uri = uri.substring(0, uri.indexOf("#"));
        window.history.replaceState({}, document.title, clean_uri);
    }
}

function copyToClipboard(element) {
    element.select();
    navigator.clipboard.writeText(element.val());
}
