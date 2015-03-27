(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-parallax", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    var parallaxes      = [],
        scrolltop       = 0,
        checkParallaxes = function() {

            scrolltop = UI.$win.scrollTop();

            UI.support.requestAnimationFrame.apply(window, [function(){
                for (var i=0; i < parallaxes.length; i++) {
                    parallaxes[i].process();
                }
            }]);
        };


    UI.component('parallax', {

        defaults: {
            velocity : 0.5,
            target   : false,
            dock     : false
        },

        boot: function() {

            // listen to scroll and resize
            UI.$doc.on("scrolling.uk.document", checkParallaxes);
            UI.$win.on("load resize orientationchange", UI.Utils.debounce(checkParallaxes, 50));

            // init code
            UI.ready(function(context) {

                UI.$('[data-uk-parallax]', context).each(function() {

                    var parallax = UI.$(this);

                    if (!parallax.data("parallax")) {
                        var obj = UI.parallax(parallax, UI.Utils.options(parallax.attr("data-uk-parallax")));
                    }
                });
            });
        },

        init: function() {

            this.base     = this.options.target ? UI.$(this.options.target) : this.element;
            this.props    = {};
            this.velocity = (this.options.velocity || 1);

            Object.keys(this.options).forEach(function(prop){

                if (prop == 'target' || prop == 'velocity' || prop == 'dock' || prop == 'plugins') {
                    return;
                }

                var startend = String(this.options[prop]).split(','),
                    start    = parseFloat(startend[1] ? startend[0] : this._getStartValue(prop)),
                    end      = parseFloat(startend[1] ? startend[1] : startend[0]);

                this.props[prop] = { 'start': start, 'end': end, 'dir': (start < end ? 1:-1), 'diff': (start < end ? (end-start):(start-end)) };

            }.bind(this));

            parallaxes.push(this);
        },

        process: function() {

            var base    = this.base,
                offset  = base.offset(),
                height  = base.outerHeight(),
                wh      = window.innerHeight,
                percent = 0,
                top     = scrolltop < wh ? scrolltop : scrolltop - wh,
                start   = offset.top < wh ? 0 : offset.top - wh,
                end     = this.options.dock ? offset.top : offset.top + height;

            if (end > (UI.$html.height() - 2*wh)) {
                end = UI.$html.height() - wh;
            }

            if (scrolltop < start) {
                percent = 0;
            } else if(scrolltop > end) {
                percent = 1;
            } else {
                percent = (start ? scrolltop : top ) / end;
            }

            this.update(percent);
        },

        update: function(percent) {

            var css        = {'transform':''},
                compercent = percent * (1 - (this.velocity - (this.velocity * percent))),
                opts, val;

            if (compercent < 0) compercent = 0;
            if (compercent > 1) compercent = 1;


            if (this._percent !== undefined && this._percent == compercent) {
                return;
            }

            Object.keys(this.props).forEach(function(prop) {

                opts = this.props[prop];

                if (percent === 0) {
                    val = opts.start;
                } else if(percent === 1) {
                    val = opts.end;
                } else {
                    val = opts.start + (opts.diff * compercent * opts.dir);
                }

                if ((prop == 'bg' || prop == 'bg%') && !this._bgcovered) {
                    css['background-size']   = 'cover';
                    css['background-repeat'] = 'no-repeat';
                    this._bgcovered = true;
                }

                switch(prop) {

                    // transforms
                    case "x":
                        css.transform += ' translateX('+val+'px)';
                        break;
                    case "xp":
                        css.transform += ' translateX('+val+'%)';
                        break;
                    case "y":
                        css.transform += ' translateY('+val+'px)';
                        break;
                    case "yp":
                        css.transform += ' translateY('+val+'%)';
                        break;
                    case "rotate":
                        css.transform += ' rotate('+val+'deg)';
                        break;
                    case "scale":
                        css.transform += ' scale('+val+')';
                        break;

                    // bg image
                    case "bg":
                        css['background-position'] = '50% '+val+'px';
                        break;
                    case "bgp":
                        css['background-position'] = '50% '+val+'%';
                        break;

                    default:
                        css[prop] = val;
                        break;
                }

            }.bind(this));

            this.element.css(css);

            this._percent = compercent;
        },

        _getStartValue: function(prop) {

            var value = 0;

            switch(prop) {
                default:
                    value = this.element.css(prop);
            }

            return (value || 0);
        }

    });

    return UI.parallax;
});
