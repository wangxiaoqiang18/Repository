/**
 * @fileOverview
 * @author rainszhang
 * @version 1
 * Created: 13-7-8 上午00:54
 */
LBF.define('ui.Nodes.Checkbox', function (require) {
    var $ = require('lib.jQuery'),
        Node = require('ui.Nodes.Node'),
        each = require('lang.each'),
        extend = require('lang.extend');

    var ICheckbox = Node.inherit({
        /**
         * Render scrollspy's attribute
         * @method render
         * @chainable
         * @protected
         */
        render: function () {
            var selector = this.get('selector'),
                checked = this.get('checked'),
                disabled = this.get('disabled'),
                events = this.get('events'),
                wrapTemplate = this.template(this.get('template')),
                $selector = $(selector);

            if (this.get('selector')) {
                if($selector.is('.lbf-checkbox')){
                    this.setElement($selector);
                } else {
                    if($selector.parent().is('.lbf-checkbox')){
                        //无跳动结构
                        this.setElement($selector.parent());
                    }else{
                        //二次渲染
                        $selector.wrap('<span class="lbf-checkbox"></span>')
                        this.setElement($selector.parent());
                    }
                }

            } else {

                //container渲染模式
                this.setElement(wrapTemplate(this.attributes()));
                this.$el.appendTo(this.get('container'));
            }

            //缓存
            this.set('$selector', this.$el.find('input'));

            //赋值
            this._setValue();

            //添加定制样式
            this.get('halfchecked') && this.addClass('lbf-checkbox-halfchecked');

            this.pro($, 'iCheck', 'checkbox', 'radio', 'checked', 'disabled', 'type', 'click', 'touchbegin.i touchend.i', 'addClass', 'removeClass', 'cursor', 'halfchecked');

            this.$el.iCheck.apply(this, arguments);

            checked && this.$el.iCheck("check");
            disabled && this.$el.iCheck("disable");

            return this;
        },

        _setValue: function(){
            var value;

            value = this.get('$selector').val();

            this.set('value', value);

            return value;
        },

        isChecked: function () {
            return this.get('$selector').prop('checked');
        },

        isHalfChecked: function () {
            return this.$el.is('.lbf-checkbox-halfchecked');
        },

        isDisabled: function () {
            return this.get('$selector').prop('disabled');
        },

        value: function(){
            return this._setValue();
        },

        check: function () {
            this.$el.iCheck('check');

            //去除半选态
            this.$el.removeClass('lbf-checkbox-halfchecked');

            return this;
        },


        halfCheck: function(){
            this.$el.iCheck('uncheck');

            this.$el.prop('halfchecked', 'halfchecked');
            this.$el.addClass('lbf-checkbox-halfchecked');

            return this;
        },

        uncheck: function () {
            this.$el.iCheck('uncheck');

            //去除半选态
            this.$el.removeClass('lbf-checkbox-halfchecked');

            return this;
        },

        disable: function () {
            this.trigger('disable', [this]);
            this.$el.iCheck('disable');

            return this;
        },

        enable: function () {
            this.trigger('enable', [this]);
            this.$el.iCheck('enable');

            return this;
        },

        destroy: function () {
            this.trigger('destroy', [this]);
            this.$el.iCheck('destroy');

            return this;
        },

        remove: function(){
            this.trigger('remove', [this]);
            this.superclass.prototype.remove.apply(this, arguments);

            return this;
        },

        /*!
         * iCheck v0.9, http://git.io/uhUPMA
         * =================================
         * Powerful jQuery plugin for checkboxes and radio buttons customization
         *
         * (c) 2013 Damir Foy, http://damirfoy.com
         * MIT Licensed
         */

        pro: function ($, _iCheck, _checkbox, _radio, _checked, _disabled, _type, _click, _touch, _add, _remove, _cursor, _halfchecked) {
            var icheckbox = this;

            // Create a plugin
            $.fn[_iCheck] = function (options, fire) {

                // Cached vars
                var user = navigator.userAgent,
                    mobile = /ipad|iphone|ipod|android|blackberry|windows phone|opera mini/i.test(user),
                    handle = ':' + _checkbox + ', :' + _radio,
                    stack = $(),
                    walker = function (object) {
                        object.each(function () {
                            var self = $(this);

                            if (self.is(handle)) {
                                stack = stack.add(self);
                            } else {
                                stack = stack.add(self.find(handle));
                            }
                            ;
                        });
                    };

                // Check if we should operate with some method
                if (/^(check|uncheck|toggle|disable|enable|update|destroy)$/.test(options)) {

                    // Find checkboxes and radio buttons
                    walker(this);

                    return stack.each(function () {
                        var self = $(this);

                        if (options == 'destroy') {
                            tidy(self, 'ifDestroyed');
                        } else {
                            operate(self, true, options);
                        }
                        ;

                        // Fire method's callback
                        if ($.isFunction(fire)) {
                            fire();
                        }
                        ;
                    });

                    // Customization
                } else if (typeof options == 'object' || !options) {

                    //  Check if any options were passed
                    var settings = $.extend({
                            checkedClass: 'lbf-checkbox-'+ _checked,
                            disabledClass: 'lbf-checkbox-'+ _disabled,
                            halfcheckedClass: 'lbf-checkbox-'+ _halfchecked,
                            labelHover: true
                        }, options),

                        selector = settings.handle,
                        hoverClass = settings.hoverClass || 'lbf-checkbox-hover',
                        focusClass = settings.focusClass || 'lbf-checkbox-focus',
                        activeClass = settings.activeClass || 'lbf-checkbox-active',
                        labelHover = !!settings.labelHover,
                        labelHoverClass = settings.labelHoverClass || 'lbf-checkbox-hover',

                    // Setup clickable area
                        area = ('' + settings.increaseArea).replace('%', '') | 0;

                    // Selector limit
                    if (selector == _checkbox || selector == _radio) {
                        handle = ':' + selector;
                    }
                    ;

                    // Clickable area limit
                    if (area < -50) {
                        area = -50;
                    }
                    ;

                    // Walk around the selector
                    walker(this);

                    return stack.each(function () {
                        var self = $(this);

                        // If already customized
                        tidy(self);

                        var node = this,
                            id = node.id,

                        // Layer styles
                            offset = -area + '%',
                            size = 100 + (area * 2) + '%',
                            layer = {
                                position: 'absolute',
                                top: offset,
                                left: offset,
                                display: 'block',
                                width: size,
                                height: size,
                                margin: 0,
                                padding: 0,
                                background: '#fff',
                                border: 0,
                                opacity: 0
                            },

                        // Choose how to hide input
                            hide = mobile ? {
                                position: 'absolute',
                                visibility: 'hidden'
                            } : area ? layer : {
                                position: 'absolute',
                                opacity: 0
                            },

                        // Get proper class
                            className = node[_type] == _checkbox ? settings.className || 'i' + _checkbox : settings.className || 'i' + _radio,

                        // Find assigned labels
                            label = $('label[for="' + id + '"]').add(self.closest('label')),

                        // Wrap input
                            parent = icheckbox.$el,

                        // Layer addition
                            helper;

                        //rains

                        helper = $('<ins class="lbf-checkbox-helper"/>').css(layer).appendTo(parent);

                        // Finalize customization
                        self.data(_iCheck, {o: settings, s: self.attr('style')}).css(hide);
                        !!settings.inheritClass && parent[_add](node.className);
                        !!settings.inheritID && id && parent.attr('id', _iCheck + '-' + id);
                        parent.css('position') == 'static' && parent.css('position', 'relative');
                        operate(self, true, 'update');

                        // Label events
                        if (label.length) {
                            label.on(_click + '.i mouseenter.i mouseleave.i ' + _touch, function (event) {
                                var type = event[_type],
                                    item = $(this);

                                // Do nothing if input is disabled
                                if (!node[_disabled]) {

                                    // Click
                                    if (type == _click) {
                                        operate(self, false, true);
                                        parent.removeClass('lbf-checkbox-halfchecked');

                                        // Hover state
                                    } else if (labelHover) {
                                        if (/ve|nd/.test(type)) {
                                            // mouseleave|touchend
                                            parent[_remove](hoverClass);
                                            item[_remove](labelHoverClass);
                                        } else {
                                            parent[_add](hoverClass);
                                            item[_add](labelHoverClass);
                                        }
                                        ;
                                    }
                                    ;

                                    if (mobile) {
                                        event.stopPropagation();
                                    } else {
                                        return false;
                                    }
                                    ;
                                }
                                ;
                            });
                        }
                        ;

                        // Input events
                        self.on(_click + '.i focus.i blur.i keyup.i keydown.i keypress.i', function (event) {
                            var type = event[_type],
                                key = event.keyCode;

                            // Click
                            if (type == _click) {
                                parent.removeClass('lbf-checkbox-halfchecked');
                                return false;

                                // Keydown
                            } else if (type == 'keydown' && key == 32) {
                                if (!(node[_type] == _radio && node[_checked])) {
                                    if (node[_checked]) {
                                        off(self, _checked);
                                    } else {
                                        on(self, _checked);
                                    }
                                    ;
                                }
                                ;

                                return false;

                                // Keyup
                            } else if (type == 'keyup' && node[_type] == _radio) {
                                !node[_checked] && on(self, _checked);

                                // Focus/blur
                            } else if (/us|ur/.test(type)) {
                                parent[type == 'blur' ? _remove : _add](focusClass);
                            }
                            ;
                        });

                        // Helper events
                        helper.on(_click + ' mousedown mouseup mouseover mouseout ' + _touch, function (event) {
                            var type = event[_type],

                            // mousedown|mouseup
                                toggle = /wn|up/.test(type) ? activeClass : hoverClass;

                            // Do nothing if input is disabled
                            if (!node[_disabled]) {

                                // Click
                                if (type == _click) {
                                    operate(self, false, true);
                                    parent.removeClass('lbf-checkbox-halfchecked');

                                    // Active and hover states
                                } else {

                                    // State is on
                                    if (/wn|er|in/.test(type)) {
                                        // mousedown|mouseover|touchbegin
                                        parent[_add](toggle);

                                        // State is off
                                    } else {
                                        parent[_remove](toggle + ' ' + activeClass);
                                    }
                                    ;

                                    // Label hover
                                    if (label.length && labelHover && toggle == hoverClass) {

                                        // mouseout|touchend
                                        label[/ut|nd/.test(type) ? _remove : _add](labelHoverClass);
                                    }
                                    ;
                                }
                                ;

                                if (mobile) {
                                    event.stopPropagation();
                                } else {
                                    return false;
                                }
                                ;
                            }
                            ;
                        });
                    });
                } else {
                    return this;
                }
                ;
            };

            // Do something with inputs
            function operate(input, direct, method) {
                var node = input[0];

                // disable|enable
                state = /ble/.test(method) ? _disabled : _checked,
                    active = method == 'update' ? {checked: node[_checked], disabled: node[_disabled]} : node[state];

                // Check and disable
                if (/^ch|di/.test(method) && !active) {
                    on(input, state);

                    // Uncheck and enable
                } else if (/^un|en/.test(method) && active) {
                    off(input, state);

                    // Update
                } else if (method == 'update') {

                    // Both checked and disabled states
                    for (var state in active) {
                        if (active[state]) {
                            on(input, state, true);
                        } else {
                            off(input, state, true);
                        }
                        ;
                    }
                    ;

                } else if (!direct || method == 'toggle') {

                    // Helper or label was clicked
                    if (!direct) {
                        input.trigger('ifClicked');
                        icheckbox.trigger('click', [icheckbox]);
                    }
                    ;

                    // Toggle checked state
                    if (active) {
                        if (node[_type] !== _radio) {
                            off(input, state);
                            icheckbox.trigger('uncheck', [icheckbox]);
                        }
                        ;
                    } else {
                        on(input, state);
                        icheckbox.trigger('check', [icheckbox]);
                    }
                    ;
                }
                ;
            };

            // Set checked or disabled state
            function on(input, state, keep) {
                var node = input[0],
                    parent = input.parent(),
                    remove = state == _disabled ? 'enabled' : 'un' + _checked,
                    regular = option(input, remove + capitalize(node[_type])),
                    specific = option(input, state + capitalize(node[_type]));

                // Prevent unnecessary actions
                if (node[state] !== true && !keep) {

                    // Toggle state
                    node[state] = true;

                    // Trigger callbacks
                    input.trigger('ifChanged').trigger('if' + capitalize(state));
                    icheckbox.trigger('change', [icheckbox]);

                    // Toggle assigned radio buttons
                    if (state == _checked && node[_type] == _radio && node.name) {
                        var form = input.closest('form'),
                            stack = 'input[name="' + node.name + '"]';

                        stack = form.length ? form.find(stack) : $(stack);

                        stack.each(function () {
                            if (this !== node && $(this).data(_iCheck)) {
                                off($(this), state);
                            }
                            ;
                        });
                    }
                    ;
                }
                ;

                // Add proper cursor
                if (node[_disabled] && !!option(input, _cursor, true)) {
                    parent.find('.lbf-checkbox-helper').css(_cursor, 'default');
                }
                ;

                // Add state class
                parent[_add](specific || option(input, state));

                // Remove regular state class
                parent[_remove](regular || option(input, remove) || '');
            };

            // Remove checked or disabled state
            function off(input, state, keep) {
                var node = input[0],
                    parent = input.parent(),
                    callback = state == _disabled ? 'enabled' : 'un' + _checked,
                    regular = option(input, callback + capitalize(node[_type])),
                    specific = option(input, state + capitalize(node[_type]));

                // Prevent unnecessary actions
                if (node[state] !== false && !keep) {

                    // Toggle state
                    node[state] = false;

                    // Trigger callbacks
                    input.trigger('ifChanged').trigger('if' + capitalize(callback));
                    icheckbox.trigger('change', [icheckbox]);
                }
                ;

                // Add proper cursor
                if (!node[_disabled] && !!option(input, _cursor, true)) {
                    parent.find('.lbf-checkbox-helper').css(_cursor, 'pointer');
                }
                ;

                // Remove state class
                parent[_remove](specific || option(input, state) || '');

                // Add regular state class
                parent[_add](regular || option(input, callback));
            };

            // Remove all traces of iCheck
            function tidy(input, callback) {
                if (input.data(_iCheck)) {

                    // Remove everything except input
                    input.parent().html(input.attr('style', input.data(_iCheck).s || '').trigger(callback || ''));

                    // Unbind events
                    input.off('.i').unwrap();
                    $('label[for="' + input[0].id + '"]').add(input.closest('label')).off('.i');
                }
                ;
            };

            // Get some option
            function option(input, state, regular) {
                if (input.data(_iCheck)) {
                    return input.data(_iCheck).o[state + (regular ? '' : 'Class')];
                }
                ;
            };

            // Capitalize some string
            function capitalize(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            };
        }
    });

    ICheckbox.include({
        /**
         * Default settings
         * @property settings
         * @type Object
         * @static
         * @protected
         */
        settings: {
            selector: null,

            container: null,

            template: [
                '<span class="lbf-checkbox',
                '<% if(checked) { %> ',
                'lbf-checkbox-checked',
                '<% } %>',
                '<% if(halfchecked) { %> ',
                'lbf-checkbox-halfchecked',
                '<% } %>',
                '<% if(disabled) { %> ',
                'lbf-checkbox-disabled',
                '<% } %>',
                '">',
                '<input type="checkbox"',
                '<% if(id) { %> ',
                'id="<%=id%>"',
                '<% } %>',
                '<% if(name) { %> ',
                'name="<%=name%>"',
                '<% } %>',
                '<% if(checked) { %> ',
                'checked',
                '<% } %>',
                '<% if(halfchecked) { %> ',
                'halfchecked',
                '<% } %>',
                '<% if(disabled) { %> ',
                'disabled',
                '<% } %>',
                ' />',
                '</span>'
            ].join(''),

            id: false,

            name: false,

            checked: false,

            disabled: false,

            halfchecked: false
        }
    });

    return ICheckbox;
});
/**
 * @fileOverview
 * @author rainszhang
 * @version 1
 * Created: 13-12-28 上午9:35
 */
LBF.define('ui.widget.LightTip.LightTip', function(require){
    var $ = require('lib.jQuery'),
        extend = require('lang.extend'),
        Node = require('ui.Nodes.Node'),
        Popup = require('ui.Nodes.Popup'),
        Overlay = require('ui.Plugins.Overlay'),
        zIndexGenerator = require('util.zIndexGenerator');

    require('{theme}/lbfUI/css/LightTip.css');

    /**
     * Base popup component
     * @class Popup
     * @namespace ui.Success
     * @module Success
     * @submodule ui-Nodes
     * @extends ui.Nodes.Node
     * @constructor
     * @param {Object} [opts] Options of node
     * @param {Object} [opts.container] Container of node
     * @param {String} [opts.className] className of node
     * @param {String} [opts.width] Width of node
     * @param {String} [opts.height] Height of node
     * @param {Object} [opts.hide] Param of node when hide
     * @param {Object} [opts.hide.delay] 组件展示时间
     * @param {Object} [opts.hide.effect] 隐藏时的效果
     * @param {Object} [opts.modal] 是否采用模态层，默认开启，莫忒曾透明度为0，Overlay的参数透传
     * @param {Object} [opts.events] Node's events
     * @param {String} [opts.wrapTemplate] Template for wrap of node. P.S. The node is wrapped with some other nodes
     * @param {Boolean} [opts.centered=false] If set node to be centered to it's container
     * @example
     *      new Success({
     *          content: '提交成功'
     *      });
     */
    var LightTip = Popup.inherit({
        /**
         * Render
         * @method render
         * @chainable
         * @protected
         */
        render: function(){
            var success = this,
                wrapTemplate = this.template(this.get('wrapTemplate')),
                $el = this.$(wrapTemplate({
                    content: this.get('content')
                })),
                $container = this.$container = this.$(this.get('container'));

            this.setElement($el);

            // overlay should be added to DOM before $el
            if(this.get('modal')){
                var modal = this.get('modal');
                //写死body， by rains
                modal.container = this.get('container');
                this.plug(Overlay, modal);
            }

            // update z-index later than overlay plugin
            // update z-index later than overlay plugin
            $container.append($el.css({
                zIndex: this.get('zIndex') || zIndexGenerator()
            }));

            //基本认为宽度界面上是可控的
            if(this.get('width') !== 'auto'){
                this.width(this.get('width'));
            }

            //对高度进行处理
            if(this.get('height') !== 'auto'){
                var height = this.get('height') < $(window).outerHeight() ? this.get('height') : $(window).outerHeight();

                //对success高度赋值
                this.height(height);
            }

            // element should be in the DOM when set to center
            this.get('centered') && this.setToCenter();

            //这里不能直接this.hide(); 不然Overlay Plugin也会受影响，看有没其他方法 by rains
            this.$el.hide();

            return this;
        },

        /**
         * Render Success
         * @method success
         */
        success: function(){
            var lighttip = this;

            lighttip
                .removeClass('lbf-light-tip-error')
                .addClass('lbf-light-tip-success');

            //显示效果定制
            setTimeout(function(){
                lighttip.get('show').effect.apply(lighttip, [lighttip]);
            }, lighttip.get('show').delay);

            //隐藏（删除）效果定制
            setTimeout(function(){
                lighttip.get('hide').effect.apply(lighttip, [lighttip]);
            }, lighttip.get('hide').delay);

            return lighttip;
        },

        /**
         * Render Success
         * @method error
         */
        error: function(){
            var lighttip = this;

            lighttip
                .removeClass('lbf-light-tip-success')
                .addClass('lbf-light-tip-error');

            //显示效果定制
            setTimeout(function(){
                lighttip.get('show').effect.apply(lighttip, [lighttip]);
            }, lighttip.get('show').delay);

            //隐藏（删除）效果定制
            setTimeout(function(){
                lighttip.get('hide').effect.apply(lighttip, [lighttip]);
            }, lighttip.get('hide').delay);

            return lighttip;
        }
    });

    LightTip.include({
        /**
         * Default settings
         * @property settings
         * @type Object
         * @static
         * @protected
         */
        settings: extend(true, {}, Popup.settings, {

            //success popup 结构模板
            wrapTemplate: [
                '<div class="lbf-light-tip"><%== content %></div>'
            ].join(''),

            //默认装载容器
            container: 'body',

            //定制样式接口
            className: '',

            //success popup width
            width: 'auto',

            //success popup height
            height: 'auto',

            show: {
                delay: 0,
                effect: function(success){
                    this.fadeIn('normal', function(){
                        success.trigger('show', [success]);
                    });
                }
            },

            //隐藏时的参数定制，延时多久关闭、隐藏效果，定制此参数时，请trigger close。 建议不修改，一致讨论最佳实践。
            hide: {
                delay: 2000,
                effect: function(success){
                    this.fadeOut('normal', function(){
                        success.trigger('hide', [success]);
                    });
                }
            },

            //success popup 是否居中
            centered: true,

            //success popup 是否使用模态层
            modal: {
                opacity: 0,
                backgroundColor: 'black'
            },

            events: {
                hide: function(e, success){
                    success.remove();
                }
            }
        })
    });

    return LightTip;
});/**
 * Created by renjiale on 2016-6-27.
 */
/**
 * @fileOverview
 * @author  renjiale
 * Created: 2016-6-27
 */
LBF.define('qd/js/component/loading.aa676.js', function (require, exports, module) {
    var
        Node = require('ui.Nodes.Node'),
        Cookie = require('util.Cookie');


    exports = module.exports = Node.inherit({
        /**
         * Default UI proxy Element
         * @protected
         */
        el: 'body',

        /**
         * Default UI events
         * @property events
         * @type Object
         * @protected
         */
        events: {},
        /**
         * Nodes default UI element，this.$element
         * @property elements
         * @type Object
         * @protected
         */
        elements: {},

        /**
         * Render node
         * Most node needs overwritten this method for own logic
         * @method render
         * @chainable
         */
        render: function () {

            // 设置UI Node proxy对象，chainable method，勿删
            this.setElement(this.el);

            // 页面逻辑入口
            this.init();

            // 返回组件
            return this;
        },

        init:function(){

        },

        /**
         * 按钮显示loading效果
         * targetBtn 当前点击的元素
         * getSign delayTime后动态抓取标识是否得到请求数据的变量值
         * delayTime 延迟多长时间后显示Loading
         */
        startLoading: function (targetBtn,getSign,delayTime) {
            var target = targetBtn;
            this.loadingTimer = setTimeout(function(){
                if(getSign()){
                    clearTimeout(this.loadingTimer);
                }else{
                    target.append('<cite class="la-ball-spin-clockwise la-sm"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></cite>');
                    target.addClass('btn-loading');
                }
            },delayTime);
        },

        /**
         * 获得loading的timer，以便随时清除
         */
        clearLoading:function(targetBtn){
            var target = targetBtn;
            if(target.hasClass('btn-loading')){
                target.children('cite').remove();
                target.removeClass('btn-loading');
                clearTimeout(this.loadingTimer);
            }
        },

        /**
         * loading计时，如果超过60s，则不显示loading
         */
        loadingTimer:function(){

        }
    })
});
