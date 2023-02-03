jQuery(window).ready(function () {
    let size = 26
    let captionSize = 10
    if (jQuery('.page-template-page-pricing').length) {
        size = 26
    }
    if (jQuery('.page-template-page-booster-landing').length) {
        size = 36
        captionSize = 14
    }
    if (matchMedia('screen and (max-width:1260px) and (min-width:768px)').matches) {
        size = 18
        if (jQuery('.page-template-page-pricing').length) {
            size = 20
        }
        if (jQuery('.page-template-page-booster-landing').length) {
            size = 36
            captionSize = 14
        }
    } else if (matchMedia('screen and (max-width:767px)').matches){
        size = 18
        if (jQuery('.page-template-page-booster-landing').length || jQuery('.page-template-page-pricing').length) {
            size = 20
            captionSize = 10
        }
    }
    jQuery('#countdown').timeTo({
        timeTo: new Date('Feb 17 2023 13:00:00 GMT-0800 (EET)'),
        displayDays: 2,
        displaySeconds: false,
        displayCaptions: true,
        fontSize: size,
        captionSize: captionSize,
    });
    window.addEventListener('focus', function() {
        jQuery('#countdown').timeTo({
            timeTo: new Date('Feb 17 2023 13:00:00 GMT-0800 (EET)'),
            displayDays: 2,
            displaySeconds: false,
            displayCaptions: true,
            fontSize: size,
            captionSize: captionSize,
        });
    });
});
