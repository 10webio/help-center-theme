/*
 * jQuery v1.9.1 included
 */
const helpCenterEndpoint = "https://help.10web.io/api/v2/help_center/";
const helpCenterLink = "https://help.10web.io/hc/en-us/";
const mainSections = {
    "4403735323410" : {
        "name" : "Getting Started",
        "custom" :
            [
                {
                    "id":"4403773285138",
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


var tenweb_jwt = 'NULL';
var bot_disabled = false;
var chat_mode = 'hidden';

$(document).ready(function() {

    article_titles();
    let pageInfo = getPageInfo(window.location.href);

    /*Remove same title from breadcrumbs*/
    if (pageInfo.type && pageInfo.type === "articles") {
        let same = [];
        $('.breadcrumbs li').each(function(i, e){
            let text = $(this).text().toLowerCase();
            if( $.inArray(text, same) > -1 ) {
                $(this).remove();
            } else {
                same.push( text );
            }
        });
    }

    // Add vote up and down message
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

    /*
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

    var ask_question = jQuery('.advanced_chat-bubble');
    var no_plugins = ask_question.hasClass('no_plugins');
    var chat_department = tenweb_get_chat_department( no_plugins );
    var user_id = getCookie("db-user-id");

    setTimeout(function () {
        $("#advanced_chat").fadeIn('slow');
        $(".chats-container, #advanced_chat").removeAttr("style");
        if ( typeof zE == 'undefined' ) {
            tenweb_openZEChat( chat_department );
        }
    }, 100);

    $(".resource_item.contact_us").on('click', function(){
        if( typeof zE != 'undefined' && zE('webWidget:get', 'chat:isChatting') ) {
            zE('webWidget', 'show');
            zE('webWidget', 'open');
        }
        else {
            $(".chats-chat-name").toggleClass('chats-chat-name-opened');
            tenweb_openZEChat( chat_department );
            // Check to preload chat only on first click.
            if ( $( '#ze-snippet' ).length == 0 ) {
                tenweb_openZEChat( chat_department );
            }
        }
        zE('webWidget', 'setLocale', 'en');
        return false;
    });


    ask_question.on('click', function (a) {
        if( typeof zE != 'undefined' && zE('webWidget:get', 'chat:isChatting') ) {
            zE('webWidget', 'show');
            zE('webWidget', 'open');
        }
        else {
            $(".chats-chat-name").toggleClass('chats-chat-name-opened');
            $(".chats").toggleClass('chats-opened');
            tenweb_openZEChat( chat_department );
            // Check to preload chat only on first click.
            if ( $( '#ze-snippet' ).length == 0 ) {
                tenweb_openZEChat( chat_department );
            }
        }
        zE('webWidget', 'setLocale', 'en');
        return false;
    });

    /*Video*/
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


    /*Popup*/
    $(".article-body img, .article-body video").click(function (e) {
        e.preventDefault();
        showPopup(e, 'popup');
    });

    /* for trial button
    if(typeof getCookie('db-user-id') === "undefined") {
         $('.sign-up').removeClass("hidden");
     }*/

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
    // social share popups
    $(".share a").click(function(e) {
        e.preventDefault();
        window.open(this.href, "", "height = 500, width = 500");
    });

    // show form controls when the textarea receives focus or back button is used and value exists
    const $commentContainerTextarea = $(".comment-container textarea"),
        $commentContainerFormControls = $(".comment-form-controls, .comment-ccs");

    $commentContainerTextarea.one("focus", function() {
        $commentContainerFormControls.show();
    });
    if ($commentContainerTextarea.val() !== "") {
        $commentContainerFormControls.show();
    }

    // Expand Request comment form when Add to conversation is clicked
    const $showRequestCommentContainerTrigger = $(".request-container .comment-container .comment-show-container"),
        $requestCommentFields = $(".request-container .comment-container .comment-fields"),
        $requestCommentSubmit = $(".request-container .comment-container .request-submit-comment");

    $showRequestCommentContainerTrigger.on("click", function() {
        $showRequestCommentContainerTrigger.hide();
        $requestCommentFields.show();
        $requestCommentSubmit.show();
        $commentContainerTextarea.focus();
    });

    // Mark as solved button
    const $requestMarkAsSolvedButton = $(".request-container .mark-as-solved:not([data-disabled])"),
        $requestMarkAsSolvedCheckbox = $(".request-container .comment-container input[type=checkbox]"),
        $requestCommentSubmitButton = $(".request-container .comment-container input[type=submit]");

    $requestMarkAsSolvedButton.on("click", function () {
        $requestMarkAsSolvedCheckbox.attr("checked", true);
        $requestCommentSubmitButton.prop("disabled", true);
        $(this).attr("data-disabled", true).closest("form").submit();
    });

    // Change Mark as solved text according to whether comment is filled
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

    function getCookie(name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ))
        return matches ? decodeURIComponent(matches[1]) : undefined
    }

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

    /* if ($("#user-nav").children().length === 0) {
         $(".header .icon-menu").hide();
     }*/

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

    var $temp = $("<input>");
    var $url = $(location).attr('href');

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
        var links = $(".article-body").find("h2");
        var i = $(this).index();
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
            var links = $(".article-body").find("h2");
            var sTop = $(window).scrollTop();
            if(links.length && !click) {
                $(links).each(function (index, el) {
                    if(links.eq(index + 1).length){
                        if (sTop > $(el).offset().top - 135 && sTop < links.eq(index + 1).offset().top - 135) {
                            $(".desktop-sidebar .sticky-sidebar").find("li").removeClass("active");
                            $(".desktop-sidebar .sticky-sidebar").find("li").eq(index).addClass("active");
                        }
                    } else {
                        if (sTop > $(el).offset().top - 135) {
                            $(".desktop-sidebar .sticky-sidebar").find("li").removeClass("active");
                            $(".desktop-sidebar .sticky-sidebar").find("li").eq(index).addClass("active");
                        }
                    }
                });
                if(sTop + $(window).height() == $(document).height()){
                    $(".desktop-sidebar .sticky-sidebar").find("li").removeClass("active");
                    $(".desktop-sidebar .sticky-sidebar").find("li").eq(links.length-1).addClass("active");
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


function article_titles(){
    var links = $(".article-body").find("h2");
    if($(links).length) {
        $('.article-sidebar.desktop-sidebar').toggleClass('desktop-active');
        $('.article-sidebar.mobile-sidebar').toggleClass('mobile-active');
        var ul = "<ul>";
        for(var i = 0; i < links.length; i++){
            var el_class = (i == 0) ? "active" : "";
            ul += "<li class='" + el_class + "'>";
            ul += links.eq(i).html() + "</li>";
        }
        ul += "</ul>";
        $(".sticky-sidebar").html(ul);
    }
}

function tenweb_openZEChat( chatDepartment ) {
    if ( $( '#ze-snippet' ).length == 0 ) {
        var user_id = getCookie("db-user-id");
        if ( user_id ) {

            if ( $( '#dashboardFrame' ).length == 0 ) {
                let dashboardFrame = $( '<iframe id="dashboardFrame" style="display: none;" src= "' + myDomain + '/chat-page"></iframe>' ).appendTo( 'body' );
                window.addEventListener( "message", ( event ) => {
                    if ( event.origin !== myDomain && event.origin !== myDomain )
                        return;

                    if (typeof event.data == 'string') {
                        const validJsonString = /^[\],:{}\s]*$/.test(event.data.replace(/\\["\\\/bfnrtu]/g, '@').
                        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                        replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
                        if ($('#ze-snippet').length == 0 && event.data && !validJsonString && event.data.startsWith('JWT_') && event.data != 'JWT_NULL' ) {
                            tenweb_jwt = event.data.substring(4);
                            tenweb_init_ZE(chatDepartment);
                        }
                    }
                } );
                /* Open the chat after a period of time in case if no token received. */
            }
        }
        else {
            tenweb_init_ZE( chatDepartment );
        }
    }
    else {
        //Additional check to avoid error if open chat is clicked too fast.
        //No need for else as chat will open itself after load.
        if ( typeof zE != 'undefined' ) {
            zE('webWidget', 'show');
            zE('webWidget', 'open');
        }
    }
}
function setDepartment( chat_department ) {
    if( 'Sales' == chat_department ) {
        var chat_department = 'Sales';
        var chat_department_tag = 'department_sales';
        var chat_suppress = false;

        zE('webWidget', 'updateSettings', {
            webWidget: {
                chat: {
                    concierge: {
                        avatarPath: myDomain + '/assets/images/araks2x.png',
                        name: 'Araks',
                        title: { '*': 'Support Team' }
                    }
                }
            }
        });
        zE('webWidget:on', 'userEvent', function(event) {
            if( event.action == 'Web Widget Opened' ) {
                webWidgetIframe = document.getElementById('webWidget');
                wibWigetDocument = webWidgetIframe.contentWindow.document;
                H2elmnt = wibWigetDocument.getElementsByTagName("h2")[0];
                if( typeof H2elmnt !=='undefined' ) {
                    if ( wibWigetDocument.getElementById("book_a_demo") ) {
                        wibWigetDocument.getElementById("book_a_demo").remove();
                    }
                    aHrefNode = document.createElement("a");
                    textnode = document.createTextNode("Book Your Demo Now");
                    aHrefNode.appendChild(textnode);
                    aHrefNode.href = "https://calendly.com/araks/10web-demo-call";
                    aHrefNode.target = "_blank";
                    aHrefNode.id = "book_a_demo";
                    H2elmnt.parentElement.appendChild(aHrefNode);
                }
            }
        });
    }
    else {
        var chat_department = 'Support';
        var chat_department_tag = 'department_support';
        var chat_department_object = zE('webWidget:get', 'chat:department', chat_department);
        var chat_suppress = ( chat_department_object.status=='offline' );
    }
    var bot_suppress = ( ( chat_department == 'Sales' && chat_suppress == false ) || bot_disabled == true );
    zE('webWidget', 'updateSettings', {
        webWidget: {
            chat: {
                suppress: chat_suppress,
                tags: [chat_department_tag],
                departments: {
                    select: chat_department
                }
            },
            answerBot: {
                suppress: bot_suppress
            },
            helpCenter: {
                suppress: bot_suppress
            },
            contactOptions: {
                enabled: !(bot_suppress)
            },
            contactForm: {
                tags: [chat_department_tag]
            }
        }
    });
}
function getCookie( cname ) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function openZEChatCallback( chatDepartment ) {
    $("#advanced_chat-bubble").removeClass( 'hidden' );
    zE('webWidget:on', 'chat:unreadMessages', function(number) {
        if (number > 0) {
            $('#advanced_chat-bubble_notification').addClass('bubble_notification');
            $('#chats-chat-live').addClass('bubble_notification-live');
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
        if( 'hidden' == chat_mode ) {
            zE( 'webWidget', 'hide' );
        }
        else {
            zE('webWidget', 'show');
            zE('webWidget', 'open');
        }
    });

    if( typeof zE('webWidget:get', 'display') !== 'undefined' ) {
        setDepartment( chatDepartment, bot_disabled );
        setTimeout(function(){ zE('webWidget', 'updatePath'); }, 3000);
    }
    else {
        zE('webWidget:on', 'chat:connected', function() {
            setDepartment( chatDepartment, bot_disabled );
        });
    }
    zE('webWidget:on', 'chat:start', function() {
        setDepartment( chatDepartment, bot_disabled );
    });
}
function tenweb_loadScript( src, id, callback ) {
    if ( $( '#' + id ).length == 0 ) {
        var script = document.createElement( 'script' );
        script.setAttribute( 'src', src );
        script.setAttribute( 'id', id );
        script.addEventListener( 'load', callback );
        document.head.appendChild( script );
    }
}
function tenweb_init_ZE( chatDepartment ) {
    const isTesting = getCookie('db-testing');
    if ( $( '#ze-snippet' ).length == 0) {
        tenweb_loadScript( 'https://static.zdassets.com/ekr/snippet.js?key=1b7006ee-2237-41f9-a143-958f11bc68b5', 'ze-snippet', function () {
            window.zESettings = {
                webWidget: {
                    launcher: {
                        label: {
                            '*': 'Ask a Question',
                        },
                        chatLabel: {
                            '*': 'Ask a Question'
                        }
                    },
                    answerBot: {
                        suppress: false,
                        title: {
                            '*': 'Chat with us!'
                        },
                        contactOnlyAfterQuery: true,
                    },
                    helpCenter: {
                        suppress: false,
                    },
                    chat: {
                        suppress: true,
                        title: {
                            '*': 'Chat with us!'
                        },
                        departments: {
                            select: 'Support'
                        }
                    },
                    contactOptions: {
                        enabled: true,
                        chatLabelOnline: { '*': 'Chat with an agent' },
                        contactFormLabel: { '*': 'Create a ticket' }
                    }
                }
            };
            if ( 'NULL' != tenweb_jwt && !isTesting) {
                window.zESettings.webWidget.authenticate = {
                    chat: {
                        jwtFn: ( callback ) => {
                            callback( tenweb_jwt );
                        }
                    }
                }
            }
            openZEChatCallback( chatDepartment );
        } );
    }
}
function tenweb_get_chat_department( no_plugins ) {
    var d = new Date();
    var UTCHours = d.getUTCHours();
    var get_bundle_value = 0;
    if( localStorage.getItem('get_bundle') != null ) {
        var local_get_bundle = JSON.parse(localStorage.getItem('get_bundle'));
        get_bundle_value = local_get_bundle.value;
    }
    var chat_department = 'Support';
    if ( no_plugins ) {
        if ('Sales' != chat_department ) {
            chat_department = 'Support';
        }
    }
    else {
        chat_department = 'Support';
    }
    return chat_department;
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
    var yearSpan = document.querySelector('.full_year')
    var date = new Date().getFullYear();
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

    setCategoryPageCustomSections : function(categories, index) {
        let html = "";
        if (categories.length) {
            html += "<ul class='article-list category-list'>";
            for (let i = 0; i < categories.length; i++) {
                let link = helpCenterLink + "categories/" + categories[i].id ;
                html += "<li><a href='" + link + "'>" + categories[i].name + "</a></li>";
            }
            html += "</ul>";
        }
        if ($('.section-tree-with-article > ul > li').eq(index).length) {
            $('.section-tree-with-article > ul > li').eq(index).find('.article-list').replaceWith(html);
        }
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
            statiSection = _this.section;

        /*Main Categories*/
        if (statiSection && Object.keys(statiSection).length !== 0) {
            $('.categories-page').addClass("main-categories");

            /*Videos section*/
            if (statiSection.name === "Getting Started") {
                let customArticle = statiSection.custom.find(function(el, i) {
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

            /*Custom section with categories*/
            $(".sections-ids .section-id").each(function(index, _section){
                let sectionId = $(this).data("id");
                custom = statiSection.custom.find(function(el, i) {
                    if(el.id == sectionId)
                        return true;
                });
                if (custom) {
                    customSection = helpAPI.getSection(sectionId);
                    if (customSection.section) {
                        let categories = JSON.parse(customSection.section.description);
                        _this.setCategoryPageCustomSections(categories, index);
                    }
                }
            });
        }
        else {
            $('.categories-page').addClass("other-categories");
            if($('.section-tree-with-article > ul > .section').length > 1){
                $('.section-tree-with-article > ul > .section > h2').show();
            }
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


    /*Set current category and breadcrumbs item*/
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
                /*Set current class to parent category*/
                if ($('#categories-menu li[data-id=' + parentCategoryId + ']').length) {
                    $('#categories-menu li[data-id=' + parentCategoryId + ']').addClass('current-item');
                }

                /*Add parent category item to breadcrumbs*/
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
    $("html, body").animate({scrollTop: ($('.section-tree-with-article > ul > li').eq(sectionIndex).offset().top - 120)}, 500);
}

function removeHashFromUrl()
{
    let uri = window.location.toString();
    if (uri.indexOf("#") > 0) {
        let clean_uri = uri.substring(0, uri.indexOf("#"));
        window.history.replaceState({}, document.title, clean_uri);
    }
}
