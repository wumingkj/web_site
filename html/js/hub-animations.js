/* ============================================
   Hub 滚动动画模块
   使用 IntersectionObserver 实现滚动触发动画
   支持多种动画效果，可自由组合
   ============================================ */

var HubAnimations = (function () {
    'use strict';

    var observer = null;
    var observedElements = [];

    var defaultOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
    };

    var animationClasses = {
        fadeUp: 'anim-fade-up',
        fadeDown: 'anim-fade-down',
        fadeLeft: 'anim-fade-left',
        fadeRight: 'anim-fade-right',
        scaleIn: 'anim-scale-in',
        rotateIn: 'anim-rotate-in'
    };

    function createObserver(options) {
        if (observer) {
            observer.disconnect();
        }

        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('anim-visible');

                    var delay = entry.target.getAttribute('data-anim-delay');
                    if (delay) {
                        entry.target.style.animationDelay = delay;
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, options);
    }

    return {
        init: function (options) {
            var opts = {};
            var key;
            for (key in defaultOptions) {
                if (defaultOptions.hasOwnProperty(key)) {
                    opts[key] = (options && options[key] !== undefined) ? options[key] : defaultOptions[key];
                }
            }
            createObserver(opts);
        },

        observe: function (element, animationType) {
            if (!element) return;
            if (!observer) {
                this.init();
            }

            var animClass = animationClasses[animationType] || animationClasses.fadeUp;
            element.classList.add(animClass);
            observer.observe(element);
            observedElements.push(element);
        },

        observeAll: function (selector, animationType) {
            if (!selector) return;
            var elements = document.querySelectorAll(selector);
            var self = this;
            elements.forEach(function (el) {
                self.observe(el, animationType);
            });
        },

        observeWithStagger: function (selector, animationType, staggerDelay) {
            if (!selector) return;
            staggerDelay = staggerDelay || 0.15;
            var elements = document.querySelectorAll(selector);
            var self = this;

            elements.forEach(function (el, index) {
                el.setAttribute('data-anim-delay', (index * staggerDelay).toFixed(2) + 's');
                self.observe(el, animationType);
            });
        },

        destroy: function () {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            observedElements = [];
        },

        refresh: function () {
            if (observer) {
                observer.disconnect();
                var entries = observedElements.slice();
                observedElements = [];
                var self = this;
                entries.forEach(function (el) {
                    if (el && el.parentNode) {
                        observer.observe(el);
                        observedElements.push(el);
                    }
                });
            }
        }
    };
})();