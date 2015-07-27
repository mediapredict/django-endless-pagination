(function ($) {
    'use strict';

    $.fn.endlessPaginate = function(options) {
        var defaults = {
            // Twitter-style pagination container selector.
            containerSelector: '.endless_container',
            // addition for scrolling up (in case pages are rendered "from the middle")
            containerUpSelector: '.endless_container_up',
            // Twitter-style pagination loading selector.
            loadingSelector: '.endless_loading',
            // Twitter-style pagination link selector.
            moreSelector: 'a.endless_more',
            // addition for scrolling up
            moreUpSelector: 'a.endless_more_up',
            // addition for scrolling up
            idPrefix: 'default-id-prefix-',
            // Digg-style pagination page template selector.
            pageSelector: '.endless_page_template',
            // Digg-style pagination link selector.
            pagesSelector: 'a.endless_page_link',
            // Callback called when the user clicks to get another page.
            onClick: function() {},
            // Callback called when the new page is correctly displayed.
            onCompleted: function() {},
            // Set this to true to use the paginate-on-scroll feature.
            paginateOnScroll: false,
            // If paginate-on-scroll is on, this margin will be used.
            paginateOnScrollMargin : 1,
            // If paginate-on-scroll is on, it is possible to define chunks.
            paginateOnScrollChunkSize: 0,
            // If separate ajax url is used to fetch pages
            paginateAjaxUrl: document.location.href.match(/(^[^#]*)/)[0]
        },
            settings = $.extend(defaults, options);

        var getContext = function(link) {
            return {
                key: link.attr('rel').split(' ')[0],
                url: link.attr('href')
            };
        };

        return this.each(function() {
            var element = $(this),
                loadedPages = 1,
                hash = window.location.hash,
                add_fragment = function(container, fragment){
                    container.before(fragment);
                    container.remove();

                    // Increase the number of loaded pages.
                    loadedPages += 1;
                };

            function handle_twitter_style_click(more_selector,
                                                container_selector,
                                                ignored_container_selector) {

                element.on('click', more_selector, function() {

                    var link = $(this),
                        html_link = link.get(0),
                        container = link.closest(container_selector),
                        loading = container.find(settings.loadingSelector);

                    // Avoid multiple Ajax calls.
                    if (loading.is(':visible')) {
                        return false;
                    }

                    link.hide();
                    loading.show();

                    var context = getContext(link);

                    // Fire onClick callback.
                    if (settings.onClick.apply(html_link, [context]) !== false) {
                        var data = 'querystring_key=' + context.key;
                        // Send the Ajax request.
                        $.get(context.url, data, function(fragment) {
                            // get rid of "more", currently we're scrolling in
                            // the opposite direction
                            fragment = $('<div>')
                              .append($(fragment).not(ignored_container_selector))
                              .html();

                            add_fragment(container, fragment);

                            // Fire onCompleted callback.
                            settings.onCompleted.apply(
                                html_link, [context, fragment.trim()]);
                        });
                    }
                    return false;
                });
            }

            if(hash && !$(hash).length){

                var hash_content = hash.split(settings.idPrefix);
                if (hash_content.length==2){

                    var id = hash_content[1],
                        ajax_url = settings.paginateAjaxUrl,
                        url = ajax_url + "?page-via-id=" + id;

                    $.get(url, "querystring_key=page", function(fragment) {
                        var container = $(settings.containerSelector);

                        add_fragment(container, fragment);

                        // refresh position
                        location.hash = "";
                        location.hash = hash;

                        handle_twitter_style_click(
                          settings.moreUpSelector,
                          settings.containerUpSelector,
                          settings.containerSelector
                        );

                    });
                }
            }

            handle_twitter_style_click(
              settings.moreSelector,
              settings.containerSelector,
              settings.containerUpSelector
            );

            // On scroll pagination.
            if (settings.paginateOnScroll) {
                var win = $(window),
                    doc = $(document);
                win.scroll(function(){
                    if (doc.height() - win.height() -
                        win.scrollTop() <= settings.paginateOnScrollMargin) {
                        // Do not paginate on scroll if chunks are used and
                        // the current chunk is complete.
                        var chunckSize = settings.paginateOnScrollChunkSize;
                        if (!chunckSize || loadedPages % chunckSize) {
                            element.find(settings.moreSelector).click();
                        }
                    }
                });
            }

            // Digg-style pagination.
            element.on('click', settings.pagesSelector, function() {
                var link = $(this),
                    html_link = link.get(0),
                    context = getContext(link);
                // Fire onClick callback.
                if (settings.onClick.apply(html_link, [context]) !== false) {
                    var page_template = link.closest(settings.pageSelector),
                        data = 'querystring_key=' + context.key;
                    // Send the Ajax request.
                    page_template.load(context.url, data, function(fragment) {
                        // Fire onCompleted callback.
                        settings.onCompleted.apply(
                            html_link, [context, fragment.trim()]);
                    });
                }
                return false;
            });
        });
    };

    $.endlessPaginate = function(options) {
        return $('body').endlessPaginate(options);
    };

})(jQuery);