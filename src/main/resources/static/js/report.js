/**
 * @fileOverview
 * @author amoschen
 * @version 1
 * Created: 12-10-27 下午4:27
 */

/**
 * UI Components
 * @main ui
 * @module ui
 */

/**
 * Single node components
 * @module ui
 * @submodule ui-Nodes
 */

LBF.define('ui.Nodes.Node', function(require){
    var each = require('lang.each'),
        defaults = require('util.defaults'),
        extend = require('lang.extend'),
        proxy = require('lang.proxy'),
        Inject = require('lang.Inject'),
        template = require('util.template'),
        Attributes = require('util.Attribute'),
        trim = require('lang.trim'),
        isString = require('lang.isString'),
        jQuery = require('lib.jQuery'),
        Class = require('lang.Class');

    var PLUGINS = '_PLUGINS';

    var methods = {},
        fn = jQuery.fn;

	// this.method = this.$el.method
    // bind jQuery fn into Node, we can consider a ui Nodes is a dom element
    for(var methodName in fn){
        if(fn.hasOwnProperty(methodName)){
            (function(methodName){
                methods[methodName] = function(){
                    if(!this.$el){
                        this.setElement('<div></div>');
                    }

                    var result = this.$el[methodName].apply(this.$el, arguments);
                    return this.$el === result ? this : result;
                }
            })(methodName);
        }
    }

    delete methods.constructor;

    /**
     * All ui components' base. All jQuery methods and template engine are mixed in.
     * @class Node
     * @namespace ui.Nodes
     * @extends lang.Class
     * @uses lib.jQuery
     * @uses util.Attributes
     * @uses lang.Inject
     * @constructor
     * @param {String|jQuery|documentElement|ui.Nodes.Node} selector Node selector
     * @example
     *      new Node('#someElement'); // Turn element, which id is 'someElement', into a node
     *
     * @example
     *      // jQuery object or Node object or document element object are all acceptable
     *      new Node($('#someElement'));
     *      new Node(new Node('#someElement'));
     *      new Node(document.getElementById('someElement'));
     */
    return Class.inherit(methods, Attributes, Inject, {
        initialize: function(opts){

			//merge options
            this.mergeOptions(opts);

			//render structure
            this.render();

            /**
             * Fire when node initialized
             * @event load
             * @param {Event} event JQuery event
             * @param {Node} node Node object
             */
            this.trigger('load', [this]);
        },

        /**
         * @method $
         * @uses lib.jQuery
         */
        $: jQuery,

        /**
         * @method jQuery
         * @uses lib.jQuery
         */
        jQuery: jQuery,

        /**
         * @method template
         * @uses util.template
         */
        template: template,

        // todo
        // copy static property settings when inheriting

        /**
         * Merge options with defaults and cache to node.opts
         * @method mergeOptions
         * @param {Object} opts Options to be merged
         * @protected
         * @chainable
         * @example
         *      node.mergeOptions({
         *          //options
         *      });
         */
        mergeOptions: function(opts){
            var data = {};

            // selector mode，merge element's data-params, if there's settings's value, options will be covered by settings's value
            // for example <span class="lbf-button" data-size="small"></span>
            opts && opts.selector && function(){
                data = this.jQuery(opts.selector).data();
            }();

            opts && opts.trigger && function(){
                data = this.jQuery(opts.trigger).data();
            }();

            // merge data & this.constructor.settings
            var options = extend(true, {}, this.constructor.settings, data);

            // use this.defaults before fall back to constructor.settings
            // which enables default settings to be inherited
            options = defaults( true, opts || (opts = {}), this.defaults || options);

            // set to attributes, keep silent to avoid firing change event
            this.set(options, { silence: true });

            return this;
        },

        /**
         * Render node
         * Most node needs overwritten this method for own logic
         * @method render
         * @chainable
         */
        render: function(){
            this.setElement(this.get('selector'));
            return this;
        },

        /**
         * Set node's $el. $el is the base of a node ( UI component )
         * Cautious: direct change of node.$el may be dangerous
         * @method setElement
         * @param {String|documentElement|jQuery|Node} el The element to be core $el of the node
         * @chainable
         */
        setElement: function(el){
            var $el = this.jQuery(el.node || el);

            if(this.$el){
                this.$el.replaceWith($el);
            }

            this.$el = $el;
            this.el = $el.get(0);

            // customize className
            if(this.get('className')) {
                this.$el.addClass(this.get('className'));
            };

            // Initialization of common elements for the component
            this.initElements();

            // Component default events
            this.delegateEvents();

            // Instance events
            this.initEvents();

            // Component's default actions, should be placed after initElements
            this.defaultActions();

            return this;
        },

        /**
         * Delegate events to node
         * @method delegateEvents
         * @param {Object} [events=this.events] Events to be delegated
         * @chainable
         * @example
         *      node.delegateEvents({
         *          'click .child': function(){
         *              alert('child clicked');
         *          }
         *      });
         */
        delegateEvents: function(events){
            events = events || this.events;
            if(!events){
                return this;
            }

            // delegate events
            var node = this;
            each(events, function(delegate, handler){
                var args = (delegate + '').split(' '),
                    eventType = args.shift(),
                    selector = args.join(' ');

                if(trim(selector).length > 0){
                    // has selector
                    // use delegate
                    node.delegate(selector, eventType, function(){
                        return node[handler].apply(node, arguments);
                    });

                    return;
                }

                node.bind(eventType, function(){
                    return node[handler].apply(node, arguments);
                });
            });

            return this;
        },

        /**
         * All default actions bound to node's $el
         * @method defaultActions
         * @protected
         */
        defaultActions: function(){

        },

        /**
         * Bind options.events
         * @method initEvents
         * @param {Object} [delegate=this] Object to be apply as this in callback
         * @chainable
         * @protected
         */
        initEvents: function(delegate){
            var node = this,
                events = this.get('events');

            if(!events){
                return this;
            }

            delegate = delegate || node;
            for(var eventName in events){
                if(events.hasOwnProperty(eventName)){
                    node.bind(eventName, proxy(events[eventName], delegate));
                }
            }

            return this;
        },

        /**
         * Find this.elements, wrap them with jQuery and cache to this, like this.$name
         * @method initElements
         * @chainable
         * @protected
         */
        initElements: function(){
            var elements = this.elements;

            if(elements){
                for(var name in elements){
                    if(elements.hasOwnProperty(name)){
                        this[name] = this.find(elements[name]);
                    }
                }
            }

            return this;
        },

        /**
         * Init plugins in initialization options
         * @chainable
         * @protected
         */
        initPlugins: function(){
            var plugins = this.get('plugins'),
                plugin;

            if(plugins){
                for(var i= 0, len= plugins.length; i< len; i++){
                    plugin = plugins[i];
                    this.plug(plugin.plugin, plugin.options);
                }
            }

            return this;
        },

        /**
         * Node element's property getter and setter
         * @method prop
         * @param {String} name Property name
         * @param [value] Property value, if you are using getter mode, leave it blank
         */
        prop: function(name, value){
            return typeof value === 'undefined' ? this.getProp(name) : this.setProp(name, value);
        },

        /**
         * Node element's property setter
         * @param {String} name Property name
         * @param value Property value
         * @chainable
         */
        setProp: function(name, value){
            this.$el.prop(name, value);
            return this;
        },

        /**
         * Node element's property getter
         * @param {String} name Property name
         * @returns {*} Property value
         */
        getProp: function(name){
            return this.$el.prop(name);
        },

        /**
         * Event trigger
         * @method trigger
         * @param {String} type Event type
         * @param {jQuery.Event} [event] Original event
         * @param {Object} [data] Additional data as arguments for event handlers
         * @returns {Boolean} Prevent default actions or not
         */
//        trigger: function( type, data, event ) {
//            var prop, orig;
//
//            data = data || {};
//            event = this.jQuery.Event( event );
//            event.type = type.toLowerCase();
//            // the original event may come from any element
//            // so we need to reset the target on the new event
//            this.$el && (event.target = this.$el[ 0 ]);
//
//            // copy original event properties over to the new event
//            orig = event.originalEvent;
//            if ( orig ) {
//                for ( prop in orig ) {
//                    if ( !( prop in event ) ) {
//                        event[ prop ] = orig[ prop ];
//                    }
//                }
//            }
//
//            this.$el.trigger( event, data );
//            return !event.isDefaultPrevented();
//        },

        /**
         * Plug a plugin to node
         * @method plug
         * @param {Plugin} Plugin Plugin class, not instance of Plugin
         * @param {Object} opts Options for plugin
         * @param {String} opts.ns Namespace of Plugin
         * @chainable
         * @example
         *      node.plug(Drag);
         *
         * @example
         *      node.plug(Drag, {
         *          //plugin options
         *          handler: '.handler',
         *          proxy: true
         *      });
         */
        plug: function(Plugin, opts){
            var plugin = new Plugin(this, opts || {});
            !this[PLUGINS] && (this[PLUGINS] = {});
            this[PLUGINS][Plugin.ns] = plugin;
            return this;
        },

        /**
         * Unplug a plugin
         * @method unplug
         * @param {String|Object} ns Namespace of Plugin or Plugin object
         * @chainable
         * @example
         *      node.unplug('Drag'); || node.unplug(Drag);
         */
        unplug: function(ns){
            if(isString(ns)){
                if(this[PLUGINS][ns]){
                    this[PLUGINS][ns].unplug();
                    this[PLUGINS][ns] = null;
                }
            }else{
                this[PLUGINS][ns.ns] && this[PLUGINS][ns.ns].unplug();
            }
            return this;
        },

        /**
         * Remove node and unplug all plugins. 'unload' event will be triggered.
         * @method remove
         * @chainable
         */
        remove: function(){
            // trigger before node is removed
            // otherwise, event bound will be remove before trigger
            /**
             * Fire when node removed
             * @event unload
             * @param {Event} event JQuery event
             * @param {Node} node Node object
             */
            this.trigger('unload', [this]);

            this.$el.remove();

            var plugins = this[PLUGINS];
            if(plugins){
                each(plugins, function(){
                    this.unplug();
                });
            }

            return this;
        }
    });
});
/**
 * @fileOverview
 * @author rainszhang
 * Created: 16-03-18
 */
LBF.define('qd/js/component/ajaxSetting.84b88.js', function (require, exports, module) {
    var JSON = require('lang.JSON');
    var Cookie = require('util.Cookie');

    (function(){
        $.ajaxSetup({
            data: {
                "_csrfToken": Cookie.get('_csrfToken') || ''
            },
            dataType: 'json',
            dataFilter: function(data, type){
                var data = data;
                // 简体转繁体的逻辑在底层实现掉，如果是繁体
                if(Cookie.get('lang') == 'zht'){
                    var str = JSON.stringify(data);

                    require.async('qd/js/component/chinese.cafe9.js', function (S2TChinese) {
                        str = S2TChinese.s2tString(str);
                    });

                    data = JSON.parse(str) || data;
                }

                return data;
            },
            statusCode: {
                401: function () {
                    //此处Login为Window下的全局属性,如果Login找不到则说明该页面未引用
                    Login && Login.showLoginPopup && Login.showLoginPopup();
                }
            }
            /*
            error: function(){
                new LightTip({
                    content: '服务器发生异常，请重试'
                }).error();
            }
            */
        });
    })();
});
/**
 * @fileOverview
 * @author yangye
 * Created: 16-04-07
 */
LBF.define('qd/js/component/header.157aa.js', function (require, exports, module) {
    var
        Node = require('ui.Nodes.Node'),
        report = require('qidian.report'),
        Autocomplete = require('ui.widget.Autocomplete.Autocomplete'),
        Login = require('qd/js/component/login.a4de6.js'),
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
        events: {
            'click #back-old': 'backOldSite',
            'mouseenter #log-web-list dd': 'showMoreWebGamePic',
            'click #closeTopGame': 'closeTopGame'
        },

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

        /**
         * 页面逻辑入口
         */
        init: function () {

            var report = {};

            var that = this;

            //作品分类下拉
            this.dropTypeList();

            //初始化首屏搜书模块
            this.initAutocompleteMod();

            // 导航右侧 页游手游下拉菜单
            this.gameDropDown();

            // 切换简繁体
            this.langCheck();

            // 切换简繁体
            this.langSwitch();

            // DOM加载完毕后执行的函数
            setTimeout(function () {
                //顶部广告
                if ($('#j-topOpBox').length != 0) {
                    that.renderBannerTop();
                }
            }, 0);
        },
        /**
         * 后加载顶部广告
         * @method renderBannerTop
         */
        renderBannerTop: function () {
            var adTop = g_data.adBanner;
            //获取后加载的模板，将json数据传入
            var bannerTop = new EJS({
                url: '/ejs/qd/js/index/bannerTop.da44d.ejs'
            }).render(adTop);
            //把广告添加到顶部
            $('#j-topOpBox').append(bannerTop);

            //页面刷新时判断cookie，如果是没有cookie，顶部广告就显示，默认是隐藏
            if (!Cookie.get('topGame')) {
                $('#topGameOp').slideDown(200);
            }
        },
        /**
         * 关闭顶部广告
         * @method closeTopGame
         * @param e 事件对象
         */
        closeTopGame: function (e) {
            var target = $(e.target);
            target.closest('#j-topOpBox').slideUp(300);

            //获取用户本地剩余时间（时间戳）
            var leftTime = ((new Date()).getTime()) % ( 86400000);
            //计算用户今天还剩下多少时间（时间戳）
            var cookieTime = 86400000 - leftTime;

            //设置当天24点之前用户看不到这个广告
            Cookie.set('topGame', '1', '.qidian.com', '', cookieTime);
        },
        /**
         * 返回旧版
         * @method backOldSite
         */
        backOldSite: function () {
            //域名
            var domainPreFix = g_data.domainPreFix;

            Cookie.set('ns', 1, 'qidian.com', '', 86400000);
            location.href = '//' + domainPreFix + 'www.qidian.com/2009';

            //点击返回旧版，则清除cookie nb
            Cookie.set('nb', 1, 'qidian.com');
        },
        /**
         * 显示页游列表的其他游戏广告图片
         * @method showMoreWebGamePic
         * @param e  事件对象
         *
         */
        showMoreWebGamePic: function (e) {
            var target = $(e.currentTarget);
            target.addClass('act').siblings().removeClass();
        },
        /**
         * 作品分类导航下拉
         * 除首页以外，hover到作品分类时显示作品分类下拉菜单
         * 绑定了作品分类li.first 和 classify-list自身事件
         * @method dropTypeList
         */
        dropTypeList: function () {
            var timer, timer2 = null;
            //移入作品分类时触发显示列表事件，用户快速划过鼠标时不触发
            $('#type-hover .first').mouseover(function () {
                //鼠标停留200毫秒才会赋值触发事件
                timer = setTimeout(function () {
                    $('#classify-list').show();
                }, 300);
                clearTimeout(timer2);
            });
            //hover到列表时仍然保持显示123
            $('#type-hover #classify-list').mouseover(function () {
                clearTimeout(timer2);
                $('#classify-list').show();
            });
            //移开作品分类和列表时，列表隐藏
            $('#type-hover .first, #type-hover #classify-list').mouseout(function () {
                clearTimeout(timer);
                timer2 = setTimeout(function () {
                    $('#classify-list').hide();
                }, 100)
            });
        },
        /**
         * 初始化首屏搜书模块
         * @method initAutocompleteMod
         */
        initAutocompleteMod: function () {
            var that = this;
            new Autocomplete({
                deferRequestBy: 300,
                maxHeight: 384,
                selector: '#s-box',
                lookup: $('#s-box').val(),
                params: {
                    siteid: 1
                },
                serviceUrl: '/ajax/Search/AutoComplete',
                groupBy: "category",
                type: 'GET',
                minChars: 0,
                onHide: function (e) {
                    setTimeout(function () {
                        //联想浮层隐藏时上报event的H事件
                        that.reportHoverEvent(e, {eid: 'qd_H_Search', ltype: 'H', l1: 2, cname: 'QDpclog'});
                    }, 100)
                },
                onSearchComplete: function (query, data, resultContainer) {
                    if (data && data.length != 0) {
                        if (Cookie.get('lang') == 'zht') {
                            var str = JSON.stringify(data);
                            require.async('qd/js/component/chinese.cafe9.js', function (S2TChinese) {
                                str = S2TChinese.s2tString(str);
                                data = JSON.parse(str);
                                if (location.pathname == '/search') {
                                    $(resultContainer).find('.lbf-autocomplete-suggestion').each(function (i) {
                                        $(this).attr('data-rid', i + 1);
                                        $(this).html('<a href="' + '//' + g_data.domainSearch + '?kw=' + encodeURIComponent(data[i].value) + '"' + '"data-eid="qd_A13">' + data[i].value + '</a>');
                                    });
                                } else {
                                    $(resultContainer).find('.lbf-autocomplete-suggestion').each(function (i) {
                                        $(this).attr('data-rid', i + 1);
                                        $(this).html('<a target="_blank" href="' + '//' + g_data.domainSearch + '/?kw=' + encodeURIComponent(data[i].value) + '"' + '"data-eid="qd_A13">' + data[i].value + '</a>');
                                    });
                                }
                            });
                        } else if (!(data.length === 1 && data[0].value.toLowerCase() == query.toLowerCase())) {//在搜索结果只有1个并且搜索内容与返回内容一致的情况下，不显示搜索框下的联想面板，因此此时不做循环处理
                            if (location.pathname == '/search') {
                                $(resultContainer).find('.lbf-autocomplete-suggestion').each(function (i) {
                                    $(this).attr('data-rid', i + 1);
                                    $(this).wrapInner('<a href="' + '//' + g_data.domainSearch + '?kw=' + encodeURIComponent(data[i].value) + '"' + '"data-eid="qd_A13"></a>');
                                });
                            } else {
                                $(resultContainer).find('.lbf-autocomplete-suggestion').each(function (i) {
                                    $(this).attr('data-rid', i + 1);
                                    $(this).wrapInner('<a target="_blank" href="' + '//' + g_data.domainSearch + '?kw=' + encodeURIComponent(data[i].value) + '"' + '"data-eid="qd_A13"></a>');
                                });
                            }
                        }

                        $.each(data, function(i, d) {
                            if (d.data && d.data.category == '书名') {
                                report.sendParams({
                                    l1: 2,
                                    ltype: 'H',
                                    eid: 'qd_S81',
                                    kw: d.value
                                })
                            }
                        })

                    } else {
                        // 无结果隐藏
                        $('#s-box').click();
                    }
                },
                onSelect: function () {
                    // Autocomplete好像有bug，选择后再次focus结果会自动隐藏
                    $('#s-box').click();
                }
            });

            /**
             * 点击搜索跳转到搜书页
             * @method searchJump
             * @param btn:点击搜索的按钮对象 word:搜索框的input对象
             */
            function searchJump(btn, word) {
                btn.on('click', function () {
                    //判断值是否是空，是空去取placeholder值后带着值传给搜索页
                    if (word.val() == '') {
                        word.val(word.attr('placeholder'))
                    }
                    var searchVal = word.val();
                    //判断域名是否是搜索页，是的话当前页面搜索，否则跳转带值跳搜索页
                    if (location.pathname == '/search') {
                        location.href = '//' + g_data.domainSearch + '?kw=' + encodeURIComponent(searchVal);
                    }
                });
            }

            searchJump($('#search-btn'), $('#s-box'));  //头部搜索跳转

            // 支持enter键搜索
            $('#s-box').on('keydown', function (evt) {
                if (evt.keyCode == 13) {
                    //判断值是否是空，是空去取placeholder值后带着值传给搜索页
                    if ($(this).val() == '') {
                        $(this).val($(this).attr('placeholder'))
                    }
                    //判断域名是否是搜索页，是的话当前页面搜索，否则跳转带值跳搜索页
                    if (location.pathname == '/search') {
                        location.href = '//' + g_data.domainSearch + '?kw=' + encodeURIComponent($('#s-box').val());
                    }
                }
            });
        },
        /**
         * 导航条 页游、手游鼠标移入移出延时下拉菜单
         * @method gameDropDown
         */
        gameDropDown: function () {
            var that = this;
            var webGame = $('#game-web');
            var phoneGame = $('#game-phone');
            var webDropDown = $('#web-dropdown');
            var phoneDropDown = $('#phone-dropdown');
            //设置页游 手游 鼠标移入移出的定时器，延迟事件。
            var webTime, webTime2, phoneTime, phoneTime2 = null;
            //页游下拉
            //设置变量，只允许页游数据请求一次，初始0，请求过后为1
            var isWebData = 0;
            webGame.mouseenter(function () {
                //鼠标停留100毫秒后才触发显示
                webTime = setTimeout(function () {
                    webDropDown.show();
                }, 300);
                clearTimeout(webTime2);

                //判断是否登录，显示页游最近玩过的页游数据
                //登录态未超时，或初次登录成功后显示最近玩过的数据
                if (Login.isLogin()) {
                    if (isWebData == 0) {
                        $.ajax({
                            url: "/ajax/PortalOps/GetRecord",
                            //允许请求头带加密信息
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data) {
                            if (data.code === 0) {
                                var latelyList = $('#lately');
                                var logWebList = $('#log-web-list');
                                latelyList.show();
                                //隐藏今日开服的后3条数据
                                logWebList.addClass('hide');
                                //获取游戏名、所在区、游戏链接
                                var gameName_1 = data.data.record[0].name;
                                var area_1 = data.data.record[0].area;
                                var jumpUrl_1 = data.data.record[0].jumpUrl;

                                //查找第一个页游DOM元素
                                var game1 = latelyList.find('dd').eq(0);
                                var game_1 = game1.find('.name');
                                var gameLink_1 = game1.find('.link');
                                var gameArea_1 = game1.find('strong');
                                //显示第一条数据
                                game1.show();

                                //填入第一个游戏信息
                                game_1.text(gameName_1);
                                gameArea_1.text(area_1);
                                game_1.attr('href', jumpUrl_1);
                                gameLink_1.attr('href', jumpUrl_1);

                                //如果玩过2个游戏，拉取第二条数据
                                if (data.data.record.length > 1) {
                                    var gameName_2 = data.data.record[1].name;
                                    var area_2 = data.data.record[1].area;
                                    var jumpUrl_2 = data.data.record[1].jumpUrl;
                                    //查找第二个页游DOM元素
                                    var game2 = latelyList.find('dd').eq(1);
                                    var game_2 = game2.find('.name');
                                    var gameLink_2 = game2.find('.link');
                                    var gameArea_2 = game2.find('strong');

                                    //填入第二个游戏信息
                                    game_2.text(gameName_2);
                                    gameArea_2.text(area_2);
                                    game_2.attr('href', jumpUrl_2);
                                    gameLink_2.attr('href', jumpUrl_2);
                                    //显示第二条数据
                                    game2.show();
                                }
                            }
                        });
                        //请求过一次后把值改成1，下次不再重复请求
                        isWebData = 1;
                    }
                }

            });
            webDropDown.mouseenter(function (e) {
                webDropDown.show(function () {
                    //上报hover事件，页游
                    //that.reportHoverEvent(e,'qd_H_yeyou','H');
                    that.reportHoverEvent(e,
                        {
                            eid: 'qd_H_yeyou',
                            ltype: 'H',
                            cname: 'QDpclog'
                        }
                    );
                });
            });
            webGame.mouseleave(function () {
                //鼠标离开100毫秒后才触发显示，为了防止从菜单移入下拉菜单短暂缝隙时菜单会被隐藏，增强体验，不闪动
                webTime2 = setTimeout(function () {
                    webDropDown.hide();
                }, 100);
                clearTimeout(webTime);
            });
            //手游下拉
            phoneGame.mouseenter(function () {
                //鼠标停留100毫秒后才触发显示
                phoneTime = setTimeout(function () {
                    phoneDropDown.show();
                }, 300);
                clearTimeout(phoneTime2);
            });
            phoneDropDown.mouseenter(function (e) {
                phoneDropDown.show(function () {
                    //上报hover事件，手游
                    //that.reportHoverEvent(e,'qd_H_shouyou','H');
                    that.reportHoverEvent(e,
                        {
                            eid: 'qd_H_shouyou',
                            ltype: 'H',
                            cname: 'QDpclog'
                        }
                    );
                });
            });
            phoneGame.mouseleave(function () {
                //鼠标离开100毫秒后才触发显示，为了防止从菜单移入下拉菜单短暂缝隙时菜单会被隐藏，增强体验，不闪动
                phoneTime2 = setTimeout(function () {
                    phoneDropDown.hide();
                }, 100);
                clearTimeout(phoneTime);
            });
        },
        /**
         * 刷新时检查是否转换简繁体
         * @method langCheck
         * 如果发现cookie 是繁体并且是静态页，请求繁体样式和字体，否则视为动态页，动态页在模板里已经做了直出
         */
        langCheck: function () {
            if (Cookie.get('lang') == 'zht' && $('body').data('dynamic') == false) {
                require.async('qd/css/tradition_font.59b13.css');
                require.async('qd/js/component/chinese.cafe9.js', function (S2TChinese) {
                    $('#switchEl').html('简体版');
                    $('#switchEl').data('eid', 'qd_A181');
                    S2TChinese.trans2Tradition('html');
                });
            }
        },
        /**
         * 主动触发简繁体切换
         * @method langSwitch
         */
        langSwitch: function () {
            $('#switchEl').click(function () {
                //简体版逻辑
                if (Cookie.get('lang') == 'zht') {
                    //此时按钮显示的是“简体版”点击会上报，所以先改eid为181给上报事件，然后再require
                    $('#switchEl').data('eid', 'qd_A181');
                    require.async('qd/js/component/chinese.cafe9.js', function (S2TChinese) {
                        Cookie.set('lang', 'zhs', 'qidian.com', '', 86400000 * 36500);
                        $('#switchEl').html('繁体版');
                        //所有需要变字体的使用js重置（后加载的也会生效）
                        $('.lang').css('fontFamily', 'FZZCYSK');
                        S2TChinese.trans2Simple('html');
                    });
                } else {
                    //否则转换成繁体
                    //此时按钮显示的是“繁体版”点击会上报，所以先改eid为182给上报事件，然后再require
                    $('#switchEl').data('eid', 'qd_A182');
                    require.async('qd/css/tradition_font.59b13.css');
                    require.async('qd/js/component/chinese.cafe9.js', function (S2TChinese) {
                        Cookie.set('lang', 'zht', 'qidian.com', '', 86400000 * 36500);
                        $('#switchEl').html('简体版');
                        //所有需要变字体的使用js重置（后加载的也会生效）
                        $('.lang').css('fontFamily', 'T_FZZCYSK');
                        S2TChinese.trans2Tradition('html');
                    });
                }
            });
        },
        /**
         * 传参 封装 hover 事件上报
         * @method reportHoverEvent
         * @param event 发送请求的事件编号
         */
        reportHoverEvent: function (e, params) {
            /**
             * 创建发送请求器
             * @method createSender
             * @param url
             */
            //var createSender = function (url) {
            //    var img = new Image();
            //    img.onload = img.onerror = function () {
            //        img = null;
            //    };
            //    img.src = url;
            //};
            //
            //var envType = g_data && g_data.envType;
            //var pageId = g_data && g_data.pageId || '';
            //var cgi = '//www.qidian.com/qreport';
            //// local & dev & oa 上报到一个错误的地址，方便自测、测试
            //if(envType !== 'pro'){
            //    cgi = '//'+ envType + 'www.qidian.com/qreport';
            //}
            //var url = cgi + '?';
            //var obj = {
            //
            //    path: 'pclog',
            //
            //    // P 浏览行为
            //    // H hover行为
            //    logtype: 'H',
            //
            //    //pageid：页面ID
            //    pageid: pageId || '',
            //
            //    //event：事件ID
            //    eventid: event || '',
            //
            //    // 当前页面url
            //    pageUrl: window.location.href,
            //
            //    // 来源referrer
            //    referer: document.referrer
            //};
            //
            //$.each(obj, function (key, value) {
            //    url = url + key + '=' + value + '&';
            //});

            // 去除最后一个&
            //url = url.substring(0, url.length - 1);
            //createSender(url);
            if (params && typeof params == 'object') {
                report.send(e, params, 'body');
            } else {
                report.send(e, params, 'body');
            }
        }
    });
});
/**
 * @fileOverview
 * @author rainszhang
 * @version 1
 * Created: 13-3-28 下午8:14
 */
LBF.define('ui.Nodes.Pagination', function(require){
    var isNumber = require('lang.isNumber'),
        extend = require('lang.extend'),
        Node = require('ui.Nodes.Node');

    /**
     * Extensive pagination with plenty options, events and flexible template
     * @class Pagination
     * @namespace ui.Nodes
     * @module ui
     * @submodule ui-Nodes
     * @extends ui.Nodes.Node
     * @constructor
     * @param {Object} [opts] Options of node
     * @param {String|jQuery|documentElement} [opts.container] Container of node
     * @param {Number} [opts.total=opts.endPage - opts.startPage + 1] Total page count
     * @param {Number} [opts.maxDisplay=opts.total] Max num of pages to be displayed
     * @param {Number} [opts.page] Current page
     * @param {Number} [opts.startPage] Start of available pages. Caution: available pages is sub set of all pages.
     * @param {Number} [opts.endPage] End of available pages. Caution: available pages is sub set of all pages.
     * @param {Object} [opts.events] Events to be bound to the node
     * @param {Function} [opts.events.change] Callback when attribute changed
     * @param {Function} [opts.events.]
     * @param {String} [opts.ellipsis='...'] Ellipsis string ( chars for replacing large page range)
     * @param {String} [opts.pageTemplate] Template for pagination. Caution: options are complex and no easy replacement.
     * @example
     *      new Pagination({
     *          container: 'someContainerSelector',
     *          page: 2,
     *          startPage: 1,
     *          endPage: 10
     *      });
     *
     * @example
     *      new Pagination({
     *          container: 'someContainerSelector',
     *          page: 2,
     *          startPage: 1,
     *          endPage: 10,
     *          headDisplay: 2,
     *          tailDisplay: 2,
     *          maxDisplay: 3,
     *          prevText: '&lt;上页',
     *          nextText: '下页&gt;',
     *          ellipsis: '--',
     *          events: {
     *              change: function(e, options){
     *                  alert('changed');
     *              }
     *          }
     *      });
     */
    var Pagination = Node.inherit({
        /**
         * Widget default UI events
         * @property events
         * @type Object
         * @protected
         */
        events: {
            'click .lbf-pagination-first': 'firstPage',
            'click .lbf-pagination-prev': 'prePage',
            'click .lbf-pagination-next': 'nextPage',
            'click .lbf-pagination-last': 'lastPage',
            'keypress .lbf-pagination-input': 'jumpBykeyboard',
            'click .lbf-pagination-input': 'focusInput',
            'click .lbf-pagination-go': 'jump',
            'click .lbf-pagination-page': 'page'
        },

        /**
         * Overwritten mergeOptions method
         * @method mergeOptions
         * @chainable
         */
        mergeOptions: function(opts){
            this.superclass.prototype.mergeOptions.apply(this, arguments);

            if(!this.get('total')){
                this.set('total', this.get('endPage') - this.get('startPage') + 1);
            }
            if(!this.get('maxDisplay') && this.get('maxDisplay') !== 0){
                this.set('maxDisplay', this.get('total'));
            }
            this.set('isInit', true);

            return this;
        },

        /**
         * Render pagination and append it to it's container if assigned
         * @method render
         * @chainable
         * @protected
         */
        render: function(){
            if(!this.get('isInit')){
                return this;
            }

            var selector = this.get('selector');
            var container =this.get('container');

            this.pageTemplate = this.template(this.get('pageTemplate'));
            var html = this.pageTemplate(extend({
                Math: Math
            }, this.attributes()));

            this.setElement(html);

            if(selector && this.$(selector).is('.lbf-pagination')){
                this.$(selector).replaceWith( this.$el );
            }else{
                this.$el.appendTo(container);
            }

            return this;
        },

        /**
         * Overwritten setElement method to bind default validator and event action before setting up attributes
         */
        setElement: function(){
            this.superclass.prototype.setElement.apply(this, arguments);

            this.defaultValidate();

            return this;
        },

        /**
         *  Default validate for attribute
         *  @protected
         *  @chainable
         */
        defaultValidate: function(){
            this.addValidate(function(attrs){
                var page = attrs.page;

                if(!isNumber(page)){
                    this.trigger && this.trigger('error', [new TypeError('Pagination: page number should be numeric')]);
                    return false;
                }

                if(attrs.startPage > page || attrs.endPage < page){
                    return false;
                }
            });

            return this;
        },

        /**
         * Default option change actions
         * @protected
         * @chainable
         */
        defaultActions: function(){
            var node = this;

            this
                .bind('change:page', function(){
                    node.render();
                })
                .bind('change:startPage', function(event, value){
                    if(value > node.get('page')){
                        node.set('page', value);
                    }
                    node.render();
                })
                .bind('change:endPage', function(event, value){
                    if(value < node.get('page')){
                        node.set('page', value);
                    }
                    node.render();
                })
                .bind('change:pageTemplate', function(){
                    node.pageTemplate = node.template(node.get('pageTemplate'));
                })
                .bind('change:container', function(){
                    node.appendTo(node.get('container'));
                });

            return this;
        },

        /**
         * Page redirection
         * @method page
         * @param {Number} page Target page
         * @chainable
         */
        page: function(page){
            if(page && page.currentTarget){
                page = this.$(page.currentTarget).data('page');
            }

            this.set('page', page);

            return this;
        },

        /**
         * Jump to page
         * @method jump
         * @param {Object} events object
         */
        jump: function(e){
            var $input = this.$el.find('.lbf-pagination-input'),
                page = $input.val();

            if(page === ''){
                $input.val('');
                $input.focus();
                return this;
            }

            if(typeof parseInt(page, 10) == 'unefined'){
                $input.val('');
                $input.focus();
                return this;
            }

            page = parseInt(page, 10);

            if(page < this.get('startPage') || page > this.get('endPage')) {
                $input.val('');
                $input.focus();
                return this;
            }

            this.set('page', page);

            return this;
        },

        /**
         * Select the input's value
         * @method focusInput
         * @chainable
         */
        focusInput: function(){
            this.$el.find('.lbf-pagination-input').select();
        },

        /**
         * Bind the keyboard events
         * @method jumpBykeyboard
         * @chainable
         */
        jumpBykeyboard: function(e){
            if(e.keyCode === 13){
                this.jump();
            };
        },

        /**
         * Redirect to first page
         * @method prePage
         * @chainable
         */
        firstPage: function(){
            return this.page(this.get('startPage'));
        },

        /**
         * Redirect to previous page
         * @method prePage
         * @chainable
         */
        prePage: function(){
            return this.page(this.get('page') - 1);
        },

        /**
         * Redirect to next page
         * @method nextPage
         * @chainable
         */
        nextPage: function(){
            return this.page(this.get('page') + 1);
        },

        /**
         * Redirect to last page
         * @method lastPage
         * @chainable
         */
        lastPage: function(){
            return this.page(this.get('endPage'));
        }
    });

    Pagination.include({
        /**
         * Default settings
         * @property settings
         * @type Object
         * @static
         * @protected
         */
        settings: {

            //是否初始化
            isInit: false,

            //是否显示跳转模块
            isShowJump: false,

            //是否显示首页按钮
            isShowFirst: false,

            //是否显示尾页按钮
            isShowLast: false,

            //当前页码，默认从第一页开始展示
            page: 1,

            //起始页码
            startPage: 1,

            //结尾页码
            endPage: 1,

            //头部显示按钮数
            headDisplay: 1,

            //尾部显示按钮数
            tailDisplay: 1,

            //分页分隔符
            ellipsis: '...',

            //默认最大显示分页数，不包括“首页 上一页 下一页 尾页”按钮
            maxDisplay: 5,

            //首页按钮默认文案
            firstText: '首页',

            //上一页按钮默认文案
            prevText: '&lt;&lt;',

            //下一页按钮默认文案
            nextText: '&gt;&gt;',

            //尾页按钮默认文案
            lastText: '尾页',

            //默认结构模板
            pageTemplate: [
                '<% var ahead = Math.min(Math.round((maxDisplay - 1) / 2), page - 1);%>',
                '<% var after = Math.min(maxDisplay - 1 - ahead, total - page);%>',
                '<% ahead = Math.max(ahead, maxDisplay - 1 - after)%>',
                '<div class="lbf-pagination">',
					'<ul class="lbf-pagination-item-list">',

						//is show first button
                        '<% if(isShowFirst) { %>',
                            '<li class="lbf-pagination-item"><a href="javascript:;" class="lbf-pagination-first <%==page <= startPage ? "lbf-pagination-disabled" : ""%>"><%==firstText%></a></li>',
                        '<% } %>',

						//prev button
						'<li class="lbf-pagination-item"><a href="javascript:;" class="lbf-pagination-prev <%==page <= startPage ? "lbf-pagination-disabled" : ""%>"><%==prevText%></a></li>',

						//headDisplay
						'<% for(var i=1; i<=headDisplay && i<=total; i++){ %>',
							'<li class="lbf-pagination-item"><a data-page="<%==i%>" href="javascript:;" class="lbf-pagination-page <%==i < startPage || i > endPage ? "lbf-pagination-disabled" : ""%> <%==i === page ? "lbf-pagination-current" : ""%>"><%==i%></a></li>',
						'<% } %>',

						//prev ellipsis
						'<% if(page - ahead > i && maxDisplay > 0) { %>',
								'<li class="lbf-pagination-item"><span class="lbf-pagination-ellipsis"><%==ellipsis%></span></li>',
						'<% } %>',

						//all pages
						'<% for(i = Math.max(page - ahead, i); i < page + after + 1 && i <= total && maxDisplay > 0; i++){ %>',
							'<li class="lbf-pagination-item"><a data-page="<%==i%>" href="javascript:;" class="lbf-pagination-page <%==i < startPage || i > endPage ? "lbf-pagination-disabled" : ""%> <%==i === page ? "lbf-pagination-current" : ""%>"><%==i%></a></li>',
						'<% } %>',

						//next ellipsis
						'<% if(page + after < total - tailDisplay && maxDisplay > 0) { %>',
							'<li class="lbf-pagination-item"><span class="lbf-pagination-ellipsis"><%==ellipsis%></span></li>',
						'<% } %>',

						//tailDisplay
						'<% for(i = Math.max(total - tailDisplay + 1, i); i<=total; i++){ %>',
							'<li class="lbf-pagination-item"><a data-page="<%==i%>" href="javascript:;" class="lbf-pagination-page <%==i < startPage || i > endPage ? "lbf-pagination-disabled" : ""%> <%==i === page ? "lbf-pagination-current" : ""%>"><%==i%></a>',
						'<% } %>',

						//next button
						'<li class="lbf-pagination-item"><a href="javascript:;" class="lbf-pagination-next <%==page >= endPage ? "lbf-pagination-disabled" : ""%>"><%==nextText%></a></li>',

						//is show last button
                        '<% if(isShowLast) { %>',
                            '<li class="lbf-pagination-item"><a href="javascript:;" class="lbf-pagination-last <%==page >= endPage ? "lbf-pagination-disabled" : ""%>"><%==lastText%></a></li>',
                        '<% } %>',
                    '</ul>',

					//isShowJump
                    '<% if(isShowJump) { %>',
                        '<div class="lbf-pagination-jump"><input type="text" class="lbf-pagination-input" value="<%==page%>" /><a href="javascript:;" class="lbf-pagination-go">GO</a></div>',
                    '<% } %>',
				'</div>'
            ].join('')
        }
    });

    return Pagination;
});
/**
 * @fileOverview
 * @author yangye
 * Created: 16-04-13
 */
LBF.define('qd/js/component/pinNav.34253.js', function (require, exports, module) {
    var
        Node = require('ui.Nodes.Node');

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
        elements: {
        },

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

        /**
         * 页面逻辑入口
         */
        init: function () {
            var that = this;

            // 导航交互：固定、显示隐藏
            this.pinTopNav();

        },
        /**
         * 处理导航交互：固定、显示隐藏
         * @methed pinTopNav
         */
        pinTopNav: function () {
            var that = this;
            var PinNav = $('#pin-nav');
            var PinSearch = $('#pin-search');
            var PinInput = $('#pin-input');

            //滚动事件显示固定导航
            $(window).scroll(function () {
                that.showPinNav();
            });

            //页面刷新后再次判断显示顶部导航
            that.showPinNav();

            //固定滚动条hover事件
            var pinTimer = null;
            PinNav.on('mouseenter', '.site-nav li, li.sign-in', function () {
                $('#pin-nav').find('li').removeClass('act');
                $(this).addClass('act');
            });
            PinNav.on('mouseleave', 'li', function () {
                $(this).removeClass('act');
            });

            PinSearch.mouseenter(function () {
                //延时触发
                //pinTimer = setTimeout(function () {
                //    if (PinInput.hasClass('hide')) {
                //        PinInput.animate({width: '150px', opacity: '1'}, 'fast').removeClass('hide');
                //    }
                //}, 200);
            }).click(function () {
                if (PinInput.val() == '') {
                    PinInput.val(PinInput.attr('placeholder'))
                }
                //判断域名是否是搜索页，是的话当前页面搜索，否则跳转带值跳搜索页
                if (g_data.domainSearch == location.hostname) {
                    location.href = '//' + g_data.domainSearch + '?kw=' + encodeURIComponent(PinInput.val());
                }
                return true;
            })
            //    .mouseleave(function () {
            //    清除定时器
            //    clearTimeout(pinTimer);
            //});

            // 支持enter键搜索
            PinInput.on('keydown', function (evt) {
                if (evt.keyCode == 13) {
                    //判断值是否是空，是空去取placeholder值后带着值传给搜索页
                    if (PinInput.val() == '') {
                        PinInput.val(PinInput.attr('placeholder'))
                    }
                    //判断域名是否是搜索页，是的话当前页面搜索，否则跳转带值跳搜索页
                    if (g_data.domainSearch == location.hostname) {
                        location.href = '//' + g_data.domainSearch + '?kw=' + encodeURIComponent(PinInput.val());
                    }
                }
            });

            //简单搜索失去焦点时滑动隐藏
            //$(document).on("click", function (e) {
            //    var target = $(e.target);
            //    if (target.closest('#pin-input, #pin-search').length == 0) {
            //        PinInput.stop().animate({width: "40px", opacity: '0'}, 'fast').addClass('hide');
            //    }
            //});
        },
        /**
         * 判断滚动条位置显示固定导航
         * @method showPinNav
         */
        showPinNav: function () {
            var that = this;
            var PinNav = $('#pin-nav');
            if ($(window).scrollTop() > 500) {
                PinNav.addClass('show');
            } else {
                PinNav.removeClass('show');
            }
        }
    });
});
/**
 * Created by renjiale on 2016/1/4.
 */
LBF.define('qd/js/component/url.c4960.js', function() {
    var URL = {
        getParamVal: function(paramName) {
            var reg = new RegExp("(^|&)" + paramName + "=([^&]*)(&|$)", "i");
            var reg2 = new RegExp("[A-Za-z]");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) {
                var final = r[2];
                if (reg2.test(final)) {
                    return r[2]
                } else {
                    return parseInt(r[2]);
                }
            }
            return null;
        },
        isValid: function(str) {
            var strRegex = "^(http(s)?(:\/\/))?(www\.)?[a-zA-Z0-9-_\.]+";
            var re = new RegExp(strRegex);

            return re.test(str);
        },
        setParam: function(url, param, paramVal) {
            var TheAnchor = null;
            var newAdditionalURL = "";
            var tempArray = url.split("?");
            var baseURL = tempArray[0];
            var additionalURL = tempArray[1];
            var temp = "";

            if (additionalURL) {
                var tmpAnchor = additionalURL.split("#");
                var TheParams = tmpAnchor[0];
                TheAnchor = tmpAnchor[1];
                if (TheAnchor)
                    additionalURL = TheParams;

                tempArray = additionalURL.split("&");

                for (i = 0; i < tempArray.length; i++) {
                    if (tempArray[i].split('=')[0] != param) {
                        newAdditionalURL += temp + tempArray[i];
                        temp = "&";
                    }
                }
            } else {
                var tmpAnchor = baseURL.split("#");
                var TheParams = tmpAnchor[0];
                TheAnchor = tmpAnchor[1];

                if (TheParams)
                    baseURL = TheParams;
            }

            if (TheAnchor)
                paramVal += "#" + TheAnchor;

            var rows_txt = temp + "" + param + "=" + paramVal;
            return baseURL + "?" + newAdditionalURL + rows_txt;
        }
    };
    return {
        getParamVal: URL.getParamVal,
        validURL: URL.isValid,
        setParam: URL.setParam
    };

});
/**
 * @fileOverview
 * @author amoschen
 * @version 1
 * Created: 13-3-18 下午2:03
 */
// todo
// event api not enough

LBF.define('ui.widget.ComboBox.ComboBox', function(require){
    var $ = require('lib.jQuery'),
        each = require('lang.each'),
        isArray = require('lang.isArray'),
        isFunction = require('lang.isFunction'),
        isObject = require('lang.isObject'),
        isNumber = require('lang.isNumber'),
        proxy = require('lang.proxy'),
        template = require('util.template'),
        extend = require('lang.extend'),
        zIndexGenerator = require('util.zIndexGenerator'),
        Node = require('ui.Nodes.Node'),
        Dropdown = require('ui.widget.Dropdown.Dropdown'),
		xssFilter = require('util.xssFilter');

    /**
     * Simple lbf-combobox component for select-like cases
     * @class Menu
     * @namespace ui.widget
     * @module ui
     * @submodule ui-widget
     * @extends ui.Nodes.Node
     * @constructor
     * @param {Object} [opts] Options of node
     * @param {String|jQuery|documentElement} [opts.container] Container of node
     * @param {String|jQuery|documentElement} [opts.selector] Select an existed tag and replace it with this. If opts.container is set, opts.selector will fail
     * @param {Object[]} [opts.options] Menu items' options
     * @param {*} [opts.options[].value] Menu item's value
     * @param {String} [opts.options[].text] Menu item's text
     * @param {Number} [opts.selectedIndex=0] Default selected option's index in options
     * @param {Object} [opts.events] Events to be bound to the node
     * @param {Function} [opts.events.select] Callback when an option is selected, no matter value is changed or not.
     * @param {Function} [opts.events.change] Callback when value is changed
     * @param {String} [opts.selectTemplate] Template for lbf-combobox's selected item.
     * @param {String} [opts.optionPanelTemplate] Template for lbf-combobox's option panel.
     * @example
     *      new ComboBox({
     *          container: 'someContainerSelector',
     *          options: [
     *              {
     *                  text: 'text1',
     *                  value: 1
     *              },
     *              {
     *                  text: 'text2',
     *                  value: 2
     *              },
     *              {
     *                  text: 'text3',
     *                  value: 3
     *              }
     *          ],
     *          selectedIndex: 2,
     *          events: {
     *              select: function(event, name, value){
     *                  alert('select');
     *              },
     *
     *              change: function(event, name, value, oldValue){
     *                  alert('change');
     *              }
     *          }
     *      });
     */
    var ComboBox = Node.inherit({
        elements: {
            '$label': '.lbf-combobox-label',
            '$caption': '.lbf-combobox-caption'
        },


        /**
         * Render the node
         * @method render
         * @chainable
         * @protected
         */
        render: function(){
            var $ = this.$,
                _this = this,
                selector = this.get('selector'),
                options = this.get('options'),
                selectedIndex = this.get('selectedIndex'),
                disabled = this.get('disabled');

            //缓存
            this.selectTemplate = this.template(this.get('selectTemplate'));
            this.panelTemplate = this.template(this.get('optionPanelTemplate'));
            this.selectOptionTemplate = this.template(this.get('selectOptionTemplate'));


            // set default index
            typeof selectedIndex !== 'undefined' && this.set('selectedIndex', selectedIndex, { silence: true });

            //如果是render原生select表单，获取原生option的数据
            if(selector){
                var $el = this.$(selector);

                // if no options set
                // use <option> tag as options source
                if(!options){
                    this.set('options', options = []);

                    // add options
                    $el.find('option').each(function(i){
                        var $option = $(this);

                        if($option.prop('selected')){
                            _this.set('value', $option.val(), { silence: true });
                            _this.set('selectedIndex', i);
                        }

                        options.push({
                            value: $option.val(),
                            text: $option.text()
                        });
                    });
                }

                /*
                 * selector = <select id="JQ selector">
                 *    <option></option>
                 * </select>
                 */
                // or
                /*
                 * selector = <div id="JQ selector" class="lbf-combobox">
                 *     <select>
                 *         <option></option>
                 *     </select>
                 *     <a href="javascript:;" class="lbf-button lbf-combobox-label">
                 *         <span class="lbf-combobox-caption"></span><span class="lbf-combobox-icon">&nbsp;</span>
                 *     </a>
                 * </div>
                 */
                this.setElement(this.$(this.selectTemplate({
                    id: $(selector).attr('id') || '',
                    options: options,
                    selectedIndex: this.get('selectedIndex')
                })));
                this.$(selector).replaceWith( this.$el );

                this.$caption.text(options[this.get('selectedIndex')].text);
            } else {
                // container

                // in case options are empty
                options = options || [];

                this.setElement(this.$(this.selectTemplate({
                    options: options,
                    selectedIndex: this.get('selectedIndex')
                })));

                // 结构并未包括原生select元素，添加原生 select 结构
                this.prepend('<select>'+ this.selectOptionTemplate({options: options}) +'</select>');

                //渲染到页面
                this.$container = $(this.get('container'));
                this.appendTo(this.$container);
            }

            this.$label = this.find('.lbf-combobox-label');
            this.$oldEl = this.find('select');

            //optionPane使用Dropdown组件
            this.renderOptionPanel();

            //初始是否可用
            disabled && this.disable();

            return this;
        },

        /**
         * Render options panel
         * @method renderOptionPanel
         * @chainable
         * @protected
         */
        renderOptionPanel: function(){
            var combobox = this,
                optionPanel = this.optionPanel,
                options = this.get('options'),
                maxDisplay = this.get('maxDisplay'),
                direction = this.get('direction'),
                show = this.get('show'),
                hide = this.get('hide'),
                events = this.get('events'),
                panelHTML = this.panelTemplate({
                    options: options
                }),
                selectHTML = this.selectOptionTemplate({
                    options: options
                });

            if(!optionPanel){
                var attrs = this.attributes();
                attrs.trigger = this.$label;
                attrs.optionsContainer && (attrs.container = attrs.optionsContainer);
                attrs.content = panelHTML;

                optionPanel = this.optionPanel =
                    new Dropdown(attrs)
                        .addClass('lbf-combobox-panel')
                        .bind('open', function(){
                            combobox.$label.addClass('lbf-combobox-on');
    						combobox.resize();
                        })
                        .bind('close.Dropdown', function(){
                            combobox.$label.removeClass('lbf-combobox-on');
                        });

                optionPanel.delegate('.lbf-combobox-item', 'click', function(event){
                    combobox.selectItem(event);
                });
            } else {
                // todo 原生表单也要刷新
                this.$oldEl.empty();
                this.$oldEl.append(selectHTML);

                optionPanel.find('.lbf-combobox-options').replaceWith(panelHTML);
            }

            this.resize();

            //$label 比 optionPanel长，取$label宽度
            // this.optionPanel.outerWidth(Math.max(this.optionPanel.width(), this.$label.outerWidth()));
            // this.$options.width(Math.max(this.optionPanel.$el.width(), $item.outerWidth()));

            return this;
        },

        resize: function(){
            //计算optionPanel的maxHeight和width

            // set combobox to show state to get real size
            var optionPanel = this.optionPanel,
                maxDisplay = this.get('maxDisplay'),
                options = this.get('options'),
                $options = this.$options = optionPanel.find('.lbf-combobox-options'),
                $item = $options.find('.lbf-combobox-item');

            // set panel's min-width of panel to combobox's width
			optionPanel.css('width', 'auto');
            var minWidth = this.outerWidth() - this.optionPanel.outerWidth() + this.optionPanel.width(),
				width = $options.width();

            optionPanel.css({
				minWidth: minWidth,
				width: width,
				height: 'auto'
			});

			if(maxDisplay < options.length){
                optionPanel.css({
					width: width + 30, //ie7下出现滚动条后会减小可视宽度;
                    height: $item.outerHeight() * maxDisplay
                });
            }
        },

        /**
         * Invoke When an item is selected
         * @method selectItem
         * @protected
         * @param {Event} event
         * @chainable
         */
        selectItem: function(event){
            var $selected = $(event.currentTarget),
                selectedName = $selected.text(),
                selectedValue = $selected.data('value');

            this.select(function(option){
                return selectedName === option.text &&
                        // selectedValue may be parsed by method data
                        typeof selectedValue === 'number' ?
                            selectedValue === parseInt(option.value, 10) :
                            selectedValue === option.value;
            });

            return false;
        },

        /**
         * Select a item by index or function
         * @method select
         * @param {Number|Function} index The index or comparator of item to be selected, or a locate function
         * @param {*} index.value When index is a filter function, the 1st argument is item's value
         * @param {*} index.name When index is a filter function, the 2nd argument is item's name
         * @chainable
         * @example
         *      lbf-combobox.select(0); // select the 1st item
         * @example
         *      // select by a filter function
         *      lbf-combobox.select(function(value, name){
         *          return value < 10; // filter out the 1st item that lower than 10
         *      });
         */
        select: function(index){
            var options = this.get('options');

            if(isFunction(index)){
                each(options, function(i, option){
                    if(index(option)){
                        index = i;
                        return false;
                    }
                });
            }

            if(!isNumber(index)){
                throw new TypeError('Invalid index for selection');
            }

            if(!options[index]){
                return;
            }

            var option = options[index],
                newValue = option.value,
                text = option.text,
                oldValue = this.val();

            /**
             * Fire when an item selected, no matter it changes or not
             * @event select
             * @param {Event} event JQuery event
             * @param newValue New value
             * @param oldValue Old value
             */
            this.trigger('select', [newValue, oldValue]);

            // when value changed
            if(newValue !== oldValue){
                //更新combobox的value和text
                this.set('value', newValue);
                this.$caption.text(text);

                //给原生表单赋值
                this.$oldEl && this.$oldEl.val(newValue);

                this.set('selectedIndex', index);

                // todo
                // by amoschen
                // change event here is occupied

                /**
                 * Fire when value changed
                 * @event change
                 * @param {Event} event JQuery event
                 * @param newValue New value
                 * @param oldValue Old value
                 */
                this.trigger('change', [newValue, oldValue]);
            }

            this.$label.focus();
            this.hideOptions();

            return this;
        },

        /**
         * Show optionPanel
         * @method hide
         * @chainable
         */
        showOptions: function(){
            this.optionPanel.open();
            this.trigger('showOptions', [this]);
            return this;
        },

        /**
         * Hide optionPanel
         * @method hide
         * @return {*}
         */
        hideOptions: function(){
            this.optionPanel.close();
            this.trigger('hideOptions', [this]);
            return this;
        },

        /**
         * add option
         * @method addOption
         * @param {Object} option Options of combobox option
         * @param options.value Value of option
         * @param options.text Text of option
         * @param {Number} pos The position options to be inserted
         * @chainable
         */
        addOption: function(option, pos){
            if(!isObject(option)){
                throw new TypeError('Invalid option');
            }

            var options = this.get('options');

            if(pos){
                options.splice(pos, 0, option);
            } else {
                options.push(option);
            }

            this.renderOptionPanel();



            return this;
        },

        /**
         * update option
         * @method updateOptions
         * @param {Object} option Options of combobox option
         * @param {Number} index Index of option to be updated
         * @chainable
         */
        updateOptions: function(option, index){
            if(!isObject(option)){
                throw new TypeError('Invalid option');
            }

            this.get('options')[index] = option;
            this.renderOptionPanel();

            return this;
        },

        /**
         * Remove option by value
         * @method removeOptionByValue
         * @param value Value of option to be removed
         * @param {Boolean} [removeAll = false] Remove all options that have the value
         * @chainable
         */
        removeOptionByValue: function(value, removeAll){
            var options = this.get('options');

            for(var i= 0, len= options.length; i< len; i++){
                if(value === options[i].value){
                    options.splice(i, 1);
                    --i;

                    // if the selected on is removed
                    // select the 1st one
                    if(this.get('selectedIndex') === i){
                        this.select(0);
                    }

                    // remove all or not
                    if(!removeAll){
                        break;
                    }
                }
            }

            this.renderOptionPanel();

            return this;
        },

        /**
         * Remove option by value
         * @method removeOptionByIndex
         * @param index Index of option to be removed
         * @chainable
         */
        removeOptionByIndex: function(index){
            var options = this.get('options');

            options.splice(index, 1);

            if(index === this.get('selectedIndex')){
                this.select(0);
            }

            this.renderOptionPanel();

            return this;
        },

        /**
         * Clear all the options
         * @method clearAllOption
         * @return {*}
         */
        removeAllOptions: function(){
            var options = this.get('options');

            options.splice(0, options.length);

            this.renderOptionPanel();

            // no option can be selceted
            this.select(0);

            return this;
        },

        /**
         * Reset options
         * @method reset
         * @chainable
         */
        reset: function(options, def){
            this.set('options', options);

            this.renderOptionPanel();

            def = def || 0;
            this.select(def);

            /**
             * Fired when options have been reset
             * @event reset
             * @param {jQuery.Event} event
             */
            this.trigger('reset');

            return this;
        },

        /**
         * Get index of option by value
         * @method index
         * @param value Value of option
         * @return {Number} Index of the option which has the given value. No match returns -1. Multiple returns index of the first one.
         */
        index: function(value){
            var options = this.get('options'),
                index = -1;

            for(var i= 0, len= options.length; i< len; i++){
                if(value === options[i].value){
                    return i;
                }
            }

            return index;
        },

        // todo
        // lastIndexOf

        /**
         * Get selected item's value
         * @method val
         * @return {*}
         */
        val: function(val){
            var name = '';

            //赋值
            if(typeof(val) != 'undefined'){
                this.optionPanel.find('.lbf-combobox-item').each(function(){
                    var $this = $(this);
                    if($this.data('value') === val){
                        name = $this.text();
                    }
                });

                //更新combobox的value和text
                this.$caption.text(name);
                this.set('value', val);

                //给原生表单赋值
                this.$oldEl && this.$oldEl.val(val);

                return this;
            }else{
                //取值
                return this.$oldEl.length > 0 ? this.$oldEl.val() : this.get('value');
            }
        },

        /**
         * Disable lbf-combobox
         * @chainable
         */
        disable: function(){
            this.trigger('disable', [this]);

            this.hideOptions();
            this.set('disabled', true);
            this.optionPanel.disable();
            this.$label.addClass('lbf-button-disabled');
            this.$label.addClass('lbf-combobox-disabled');

            return this;
        },

        /**
         * Enable lbf-combobox
         * @chainable
         */
        enable: function(){
            this.trigger('enable', [this]);

            this.set('disabled', false);
            this.optionPanel.enable();
            this.$label.removeClass('lbf-button-disabled');
            this.$label.removeClass('lbf-combobox-disabled');

            return this;
        },

        /**
         * Remove combobox.
         * @chainable
         */
        remove: function(){
            this.trigger('remove', [this]);

            this.$el.remove();
            this.optionPanel.remove();
        }
    });

    ComboBox.include({
        /**
         * Default settings
         * @property settings
         * @type Object
         * @static
         * @protected
         */
        settings: {
            selectTemplate: [
                '<div class="lbf-combobox" id="<%= id %>">',
                    '<a href="javascript:;" class="lbf-button lbf-combobox-label" data-value="<%== options[selectedIndex].value %>" hidefocus="true">',
                        '<span class="lbf-combobox-caption"><%= options[selectedIndex].text %></span>',
                        '<span class="lbf-icon lbf-icon-down lbf-combobox-icon"></span>',
                    '</a>',
                '</div>'
            ].join(''),

            optionPanelTemplate: [
                '<ul class="lbf-combobox-options">',
                    '<% for(var i=0,len=options.length; i<len; i++){ %>',
                    '<li class="lbf-combobox-option"><a class="lbf-combobox-item" href="javascript:;" onclick="return false;" data-value="<%== options[i].value %>"><%= options[i].text %></a></li>',
                    '<% }%>',
                '</ul>'
            ].join(''),

            selectOptionTemplate: [
                '<% for(var i=0,len=options.length; i<len; i++){ %>',
                '<option value="<%== options[i].value %>"><%== options[i].text %></option>',
                '<% }%>'
            ].join(''),

            show: {
                mode: 'click',
                delay: 0,
                effect: function(){
                    this.show();
                }
            },

            hide: {
                delay: 0,
                effect: function(){
                    this.hide();
                }
            },

            optionsContainer: 'body',

            options: null,

            direction: 'bottom',

            selectedIndex: 0,

            disabled: false,

            maxDisplay: 10,

            events: {
                load: function(){},
                unload: function(){},
                showOptions: function(){

                },
                hideOptions: function(){},
                enable: function(){},
                disable: function(){},
                select: function(){},
                change: function(){}
            }
        }
    });

    return ComboBox;
});
/**
 * Created by renjiale on 2016/4/22.
 */
/**
 * @fileOverview
 * @author  renjiale
 * Created: 2016-4-11
 */
LBF.define('qd/js/free/addBook.83d23.js', function (require, exports, module) {
    var
        Node = require('ui.Nodes.Node'),
        ajaxSetting = require('qd/js/component/ajaxSetting.84b88.js'),
        Checkbox = require('ui.Nodes.Checkbox'),
        Pagination = require('ui.Nodes.Pagination'),
        Cookie = require('util.Cookie'),
        Login = require('qd/js/component/login.a4de6.js'),
        LightTip = require('ui.widget.LightTip.LightTip'),
        Loading = require('qd/js/component/loading.aa676.js');

    function addToBookShelf(e, oldClassName, newClassName) {
        var that = this;
        var getResponse;
        var targetBook = $(e.currentTarget);
        //如果书已在书架中，则不需要发请求加入书架
        if (targetBook.hasClass(newClassName)) {
            return;
        }

        //如果是弱登录状态，则显示登录框
        if(!Login.isLogin()){
            Login && Login.showLoginPopup && Login.showLoginPopup();
            return;
        }

        //在按钮loading的时候再次点击则不执行逻辑
        if(targetBook.hasClass('btn-loading')){
            return;
        }

        //显示loading
        var loading = new Loading({});
        loading.startLoading(targetBook,function(){
            return getResponse;
        },200);

        //超时情况
        setTimeout(function(){
            loading.clearLoading(targetBook);
        }, 10 * 1000);

        //如果是未登录状态，则弹出登录弹窗
        if (!Login.isLogin()) {
            Login.showLoginPopup();
        } else {
            //已登录状态下，点击加入书架则直接向后端发送请求
            var bookId = targetBook.attr('data-bookId');
            $.ajax({
                type: 'GET',
                url: '/ajax/BookShelf/add',
                dataType: 'json',
                data: {
                    bookId: bookId
                },
                success: function (data) {
                    getResponse = true;
                    loading.clearLoading(targetBook);
                    if (data.code === 0) {
                        targetBook.removeClass(oldClassName);
                        targetBook.addClass(newClassName);
                        targetBook.html('已在书架');
                        new LightTip({
                            content: '<div class="simple-tips"><span class="iconfont success">&#xe61d;</span><h3>成功加入书架</h3></div></div>'
                        }).success();
                    } else {
                        switch (parseInt(data.code)) {
                            case 1002:
                                new LightTip({
                                    content: '<div class="simple-tips"><span class="iconfont error">&#xe61e;</span><h3>已经在书架中</h3></div>'
                                }).error();
                                targetBook.removeClass(oldClassName);
                                targetBook.addClass(newClassName);
                                targetBook.html('已在书架');
                                break;
                            case 1003:
                                new LightTip({
                                    content: '<div class="simple-tips"><span class="iconfont error">&#xe61e;</span><h3>书架已满</h3></div>'
                                }).error();
                                break;
                            case 1004:
                                new LightTip({
                                    content: '<div class="simple-tips"><span class="iconfont error">&#xe61e;</span><h3>加入失败</h3></div>'
                                }).error();
                                break;
                            default:
                                new LightTip({
                                    content: '<div class="simple-tips"><span class="iconfont error">&#xe61e;</span><h3>'+ data.msg +'</h3></div>'
                                }).error();
                                break;

                        }
                    }
                }
            })
        }
    }

    /**
     * 关闭登录弹窗
     * @method hideLoginPopup
     */
    $('body').on('click', '.close-popup', function () {
        Login.hideLoginPopup();
    });

    return {
        addToBookShelf: addToBookShelf
    }

});/**
 * Created by renjiale on 2016-6-27.
 */
/**
 * @fileOverview
 * @author  renjiale
 * Created: 2016-6-27
 */
LBF.define('qd/js/component/common.08bc6.js', function (require, exports, module) {
    var
        Node = require('ui.Nodes.Node'),
        BrowserSupport = require('qd/js/component/browserSupport.1ad6c.js'),
        Login = require('qd/js/component/login.a4de6.js'),
        report = require('qidian.report'),
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
            var that = this;
            // 设置UI Node proxy对象，chainable method，勿删
            this.setElement(this.el);

            // 页面逻辑入口
            this.init();

            // 返回组件
            return this;
        },
        /**
         * 页面逻辑入口
         */
        init: function () {
            var that = this;

            //环境变量
            var env = g_data.envType == 'pro' ? '' : g_data.envType;

            //判断是主站还是女生网，并不是所有页面后台都会传data.bookInfo.bookType，所以需要做容错，默认是主站 === 0 是女生网
            if (typeof (g_data.isWebSiteType) === 'undefined' || g_data.isWebSiteType === 1) {
                //非线上环境方便调试查看
                if (env != '') {
                    if (typeof (g_data.isWebSiteType) === 'undefined') {
                        console.log('目前是' + env + '环境，站点类型变量是' + g_data.isWebSiteType + '，后台没有给bookType值，目前是男生网主站')
                    }
                    if (g_data.isWebSiteType === 1) {
                        console.log('目前是' + env + '环境，站点类型变量是' + g_data.isWebSiteType + '，后台给了bookType值，目前是男生网主站')
                    }
                }
                //主站上报参数siteId
                report.init({
                    isQD: true,
                    cname: 'QDpclog'
                });
            } else if (g_data.isWebSiteType === 0) {
                //女生站上报参数siteId
                //非线上环境方便调试查看
                if (env != '') {
                    console.log('目前是' + env + '环境，站点类型变量是女生网，变量值是' + g_data.isWebSiteType)
                }
                report.init({
                    isQD: true,
                    cname: 'QDmmlog'
                });
            }


            // 检查是否进行过简繁体转换
            this.checkLang();

            //页面DOM loaded完毕后执行的逻辑
            this.pageLoaded();


            // 更新提交建议链接
            $.ajax({
                url: '/ajax/Help/getCode'
            }).done(function (data) {
                if (data.code === 0) {
                    $('.footer .advice').prop('href', 'http://123.206.70.240/online/?cid=0&uid=10&code=' + data.data);
                }
            });
        },
        /**
         * 页面DOM loaded完毕后执行的逻辑
         * @method pageLoaded
         */
        pageLoaded: function () {
            //给html加上class后，所有锚点有过渡效果
            $('html').addClass('loaded');
        },
        /*
         **@method createSender 所有页面通用请求
         */
        createSender: function (url) {
            var img = new Image();
            img.onload = img.onerror = function () {
                img = null;
            };
            img.src = url;
        },
        /**
         * 检查是否进行过简繁体转换
         * @method checkLang
         */
        checkLang: function () {
            //如果页面get不到lang或者lang是zht 繁体的话，异步请求繁体字体和转换js，把html转换成繁体
            if (Cookie.get('lang') == 'zht') {
                require.async('qd/css/tradition_font.59b13.css');
                require.async('qd/js/component/chinese.cafe9.js', function (S2TChinese) {
                    $('#switchEl').html('简体版');
                    //所有需要变字体的使用js重置（后加载的也会生效）
                    $('.lang').css('fontFamily', 'T_FZZCYSK');
                    S2TChinese.trans2Tradition('html');
                });
            }
        }
    })
});
/**
 * @fileOverview
 * @author rainszhang
 * Created: 16-08-24
 */
(function(global, factory) {
    if (typeof define === 'function') {
        // 支持LBF加载
        if(typeof LBF === 'object'){
            LBF.define('qidian.report', function(){
                return factory(global);
            });
        }else{
            define(function() {
                return factory(global);
            });
        }
    } else {
        factory(global);
    }
}(this, function(window) {
    var doc = document;

    var $ = window.$ || window.Zepto || window.jQuery;

    // local & dev & oa 上报到一个错误的地址，方便自测、测试，起点通过g_data传参，其他项目默认就是直接post到运营环境了
    var envType = (function(){
        try {
            return (g_data && g_data.envType || 'pro')  === 'pro' ?  '' : g_data.envType;
        } catch(e){
            return '';
        }
    })();

    // 请求路径
    var cgi = '//'+ envType + 'qdp.qidian.com/qreport?';

    // common
    var commons = {

        // 平台
        path: 'pclog',

        // 行为 A：点击 P：浏览
        ltype: 'A',

        // 当前页面url
        url: window.location.href,

        // 来源
        ref: document.referrer,

        // 分辨率横屏
        sw: screen.width,

        // 分辨率竖屏
        sh: screen.height,

        // 横坐标
        x: '',

        // 纵坐标
        y: '',

        //页面标题
        title: document.title
    };

    // 起点中文网
    var defaults = {

        // 行为 A：点击 P：浏览
        ltype: 'A',

        // 页面ID
        pid: (function(){
            try {
                return g_data.pageId;
            } catch(e){
                return '';
            }
        })(),

        // 页面模块标识
        eid: '',

        // 书籍ID
        bid: '',

        // 章节url
        cid: '',

        // 标签名
        tid: '',

        // 列表序号
        rid: '',

        // 广告素材id，广告位
        qd_dd_p1: '',

        //广告素材
        qd_game_key:'',

        //作者id
        auid:'',

        //书单id
        blid:'',

        //算法id
        algrid:'',

        //关键词
        kw: ''
    };

    var Report = {
        /**
         * @method config
         * @param 全局配置参数，业务侧传递自定义参数可在此js中全局使用
         */
        config: function(options){
            if(options && typeof options == 'object'){
                $.extend(true, this, options);
            }
        },

        /**
         * @method init
         * @param params object {}
         */
        init: function(params){

            var that = this;

            // 页面加载后单独发请求统计PV
            $(document).ready(function(e) {

                var url = that.cgi ? that.cgi + '?': cgi;

                // 起点中文网
                var defaults = {

                    // 行为 A：点击 P：浏览
                    ltype: 'P',

                    // 页面ID
                    pid: (function(){
                        try {
                            return g_data.pageId;
                        } catch(e){
                            return '';
                        }
                    })(),

                    // 横坐标
                    x: '',

                    // 纵坐标
                    y: '',

                    //页面来源渠道,仅在页面浏览或hover的时候上报
                    chan: ''
                };

                //判断是否有e1,e2相关的domain及cookie值
                if(params && params.domain){
                    that.cookieDomain = params.domain;
                }
                if(params && params.e1){
                    that.cookieE1 = params.e1;
                }
                if(params && params.e2){
                    that.cookieE2 = params.e2;
                }

                //调用init方法时传递的参数会extend到默认的commons对象中，手动调用send方法时则无需再传递一遍
                $.extend(true, commons, params);

                var obj = $.extend({}, commons, defaults);

                // 合并url：http://www.qidian.com/qreport?path=pclog&ltype=P&pid=qd_p_qidian&url=&ref=&x=&y=&sw=&sh=&title=
                $.each(obj, function (key, value) {
                    url = url + key + '=' + encodeURIComponent(value) + '&';
                });

                // 去除最后一个&
                url = url.substring(0, url.length - 1);

                createSender(url);

                that._send(params);

                // 老起点还有额外的上报逻辑，无论如何，先一起上报了
                obj.isQD && reportOldSiteData();
                obj.isQD && reportOldSiteDataGlobalUser();
            });
        },

        /**
         * @method _send
         * @param params object {}
         */
        _send: function(params){

            //初始化时，防label与input联动造成的一次点击两次冒泡
            this.initial = 0;

            var that = this;

            $(document).off('click.Report');
            $(document).on('click.Report', function(e){
                if (e && (e.isTrigger=== true || e.isTrusted === false  || e.hasOwnProperty('_args') || (e.pageY === 0 && e.screenY === 0))) {
                    // 不信任的点击不处理
                    return;
                }

                that.send(e, params);
            })
        },

        /**
         * var $dom = $('<div data-report-l1="2" data-report-mid="3"></div>');
         * getNodeReportInfo($dom[0]) => { l1: "2", mid: "3"}
         * @method getNodeReportInfo
         * @param node
         * @returns {Array}
         */
        getNodeReportInfo: function (node) {
            var attributes = node.attributes;
            // ie8- will transfer to camelCase
            var regexpReport = /^data-?report-?(.*)$/i;
            var rs = {};
            $.each(attributes, function(index, attr) {
                var matchResult = attr.name.match(regexpReport);
                if(matchResult && matchResult.length > 1) {
                    rs[matchResult[1]] = attr.value;
                }
            });
            return rs;
        },

        /**
         * @method sendParams
         * @param params object {}
         */
        sendParams: function(params){
            // 仅支持对象类型
            if(!params) return;
            if(typeof params != 'object') return;
            var obj = $.extend({}, commons, defaults, params);
            var url = this.cgi ? this.cgi + '?': cgi;
            url = url + $.param(obj);
            createSender(url);
        },

        /**
         * @method send
         * @param e
         * @param params object {}
         */
        send: function(e, params, proxyElement){
            var now = +new Date();

            // 如果当前点击与上一次点击的间隙小于100ms，说明是label与input联动造成的一次点击两次冒泡，因此只取上次点击的上报即可
            if (now - this.initial < 100) {
                return;
            }
            //每次点击后将当前时间戳缓存
            this.initial = now;

            var target = $(e.target);

            var url = this.cgi ? this.cgi + '?': cgi;

            //位置相关参数
            var positions = {
                // 横坐标
                x: e.clientX + $('body').scrollLeft() || '',

                // 纵坐标
                y: e.clientY + $('body').scrollTop() || '',
            };


            var obj = $.extend({}, commons, defaults, positions, params);

            var currentElement = target;

            while(currentElement.get(0) && currentElement.get(0).tagName != 'BODY'){

                // 数据统计也采用冒泡层级来区分模块，会采用l1~l7来标识，l1代表最外层，html层级越往里，依次递增，l2, l3, l4……
                for(var i=0; i<7; i++){
                    if(currentElement.data('l'+(i+1))){
                        obj['l'+(i+1)] = currentElement.data('l'+(i+1));
                        break;
                    }
                }

                // 如果获取到列表index，rid在l7以内，最里层元素eid、bid、cid、tid之外
                if(currentElement.data('rid')){
                    obj.rid = currentElement.data('rid');
                }

                /**
                 * ==================================================
                 * 以下是最里层元素，在同一层
                 * ==================================================
                 */

                // 如果获取到模块ID
                if(currentElement.data('eid')){
                    obj.eid = currentElement.data('eid');
                }

                // 如果点击的是书籍
                if(currentElement.data('bid')){
                    obj.bid = currentElement.data('bid');
                }

                // 如果点击的是章节
                if(currentElement.data('cid')){
                    obj.cid = currentElement.data('cid');
                }

                // 如果点击的是标签
                if(currentElement.data('tid')){
                    obj.tid = currentElement.data('tid');
                }

                // 广告素材id，暂定是跳转url
                if(currentElement.data('qd_dd_p1') && currentElement.data('qd_dd_p1') == 1){
                    obj.qd_dd_p1 = currentElement.get(0).href || '';
                }

                // 如果点击的是页面广告素材
                if(currentElement.data('qd_game_key')){
                    obj.qd_game_key = currentElement.data('qd_game_key');
                }

                // 如果点击的是作者
                if(currentElement.data('auid')){
                    obj.auid = currentElement.data('auid');
                }

                // 如果点击的是书单
                if(currentElement.data('blid')){
                    obj.blid = currentElement.data('blid');
                }

                // 算法id
                if(currentElement.data('algrid')){
                    obj.algrid = currentElement.data('algrid');
                }

                // 如果点击了搜索联想词汇或搜索按钮，则上报kw
                if(currentElement.data('kw')){
                    obj.kw = currentElement.data('kw');
                }

                var result = this.getNodeReportInfo(currentElement[0]) || {};

                currentElement = currentElement.parent();
            }

            //获取e1,e2事件的值
            if(typeof JSON !== 'undefined'){
                this._getE1E2(obj);
            }

            // 合并url：http://www.qidian.com/qreport?ltype=A&pid=qd_p_qidian&pageUrl=&ref=&eid=qd_A102&bid=&cid=&tid=&rid=&x=177&y=1142&sw=1440&sh=900&title=
            $.each( obj, function( key, value ) {
                url = url + key + '=' + encodeURIComponent(value) + '&';
            });

            // 去除最后一个&
            url = url.substring(0, url.length-1);

            //如果参数中没有传递代理元素，则需判断l1是否存在，不存在则不能发送请求,否则发送请求。
            if(!proxyElement){
                // 防刷
                obj.l1 = obj.l1 || '';
                if(obj.l1 == ''){
                    return;
                }
            }

            //发送上报请求
            createSender(url);

            // reset 默认参数值，不然如果上一次有自定义参数，参数会一直跟随
            params = null;
        },

        //前一前二事件的支持
        _getE1E2:function(obj){
            //用于存储e1,e2的字符串对象
            var e1e2Obj = {};
            var cookieDomain = this.cookieDomain||'.qidian.com';
            var cookieE1 = this.cookieE1||'e1';
            var cookieE2 = this.cookieE1||'e2';
            //如果cookie中不存在e1,e2，则初始化e1,e2
            if(!Cookie.get(cookieE1)){
                Cookie.set(cookieE1,'',cookieDomain,'',30*24*60*60*1000);
            }
            if(!Cookie.get(cookieE2)){
                Cookie.set(cookieE2,'',cookieDomain,'',30*24*60*60*1000);
            }

            //e1,e2的值需要携带eid,pid,l值
            for(var key in obj){
                if(key == 'eid'){
                    e1e2Obj[key] = obj[key];
                }
                if(key == 'pid'){
                    e1e2Obj[key] = obj[key];
                }
                if(/l[1-9]/.test(key)){
                    e1e2Obj[key] = obj[key];
                }
            }

            //e1为当前元素点击上报的信息的集合
            obj.e1 = decodeURIComponent(Cookie.get(cookieE1));
            //e2为cookie中的e1，也就是上一次上报时设置的e1
            obj.e2 = decodeURIComponent(Cookie.get(cookieE2));

            //更新完毕e1,e2后，需重置cookie
            if(typeof JSON !== 'undefined'){
                Cookie.set(cookieE1,JSON.stringify(e1e2Obj),cookieDomain,'',30*24*60*60*1000);
                Cookie.set(cookieE2,obj.e1,cookieDomain,'',30*24*60*60*1000);
            }
        }
    };

    var Cookie = {
        /**
         * method get
         * @param name
         * @returns {null}
         */
        get: function(name){
            var carr = doc.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));

            if (carr != null){
                return decodeURIComponent(carr[2]);
            }

            return null;
        },
        /**
         * method set
         * @param name
         * @returns {null}
         */
        set:function(name, value, domain, path, expires){
            if(expires){
                expires = new Date(+new Date() + expires);
            }
            var tempcookie = name + '=' + escape(value) +
                ((expires) ? '; expires=' + expires.toGMTString() : '') +
                ((path) ? '; path=' + path : '') +
                ((domain) ? '; domain=' + domain : '');

            //Ensure the cookie's size is under the limitation
            if(tempcookie.length < 4096) {
                doc.cookie = tempcookie;
            }
        }
    };

    /**
     * 创建老站的数据上报器
     * @method createOldSiteSender
     */
    function reportOldSiteData(){

        // 只有在cookie里面的stat_sessid不存在才会发这个请求
        if (Cookie.get('stat_sessid')) {
            return;
        }

        var url = '//uedas.qidian.com/statajax.aspx?';
        var obj = {

            // 操作行为
            opName: 'AddSessionUser',

            // cookie中的stat_gid
            globalId: Cookie.get('stat_gid') || '',

            // cookie中的cmfuToken
            curToken: Cookie.get('cmfuToken') || '',

            // 页面title
            pageTitle: document.title,

            // 来源referrer
            referer: document.referrer,

            // 页面url
            pageUrl: window.location.href,

            // 页面路径
            pagePathName: window.location.pathname,

            // 页面查询部分
            pageQueryString: window.location.search,

            // 页面域名
            host: window.location.host
        };

        // 合并url: //uedas.qidian.com/statajax.aspx?opName=AddSessionUser&globalId=&referrer=&pageTitle=&host=&pagePathName=&pageQueryString=&pageUrl=&topPageUrl=&isErrorPage=0&curToken=
        $.each( obj, function( key, value ) {
            url = url + key + '=' + encodeURIComponent(value) + '&';
        });

        // 去除最后一个&
        url = url.substring(0, url.length-1);

        createSender(url);
    }

    function reportOldSiteDataGlobalUser(){

        // 只有在cookie里面的guid不存在才会发这个请求
        if (Cookie.get('stat_gid')) {
            return;
        }

        var url = '//uedas.qidian.com/statajax.aspx?';
        var obj = {

            // 操作行为
            opName: 'AddGlobalUser',

            // cookie中的stat_gid
            globalId: Cookie.get('stat_gid') || '',

            // cookie中的cmfuToken
            curToken: Cookie.get('cmfuToken') || '',

            // 页面title
            pageTitle: document.title,

            // 来源referrer
            referer: document.referrer,

            // 页面url
            pageUrl: window.location.href,

            // 页面路径
            pagePathName: window.location.pathname,

            // 页面查询部分
            pageQueryString: window.location.search,

            // 页面域名
            host: window.location.host
        };

        // 合并url: //uedas.qidian.com/statajax.aspx?opName=AddSessionUser&globalId=&referrer=&pageTitle=&host=&pagePathName=&pageQueryString=&pageUrl=&topPageUrl=&isErrorPage=0&curToken=
        $.each( obj, function( key, value ) {
            url = url + key + '=' + encodeURIComponent(value) + '&';
        });

        // 去除最后一个&
        url = url.substring(0, url.length-1);

        createSender(url);
    }

    /**
     * 创建发送请求器
     * @method createSender
     * @param url 发送的请求
     */
    function createSender(url){
        var img = new Image();
        img.onload = img.onerror = function(){
            img = null;
        };
        img.src = url;
    }

    // 如果发现是直接引用模式，透给全局，污染了全局对象：Report
    if (typeof define !== 'function') {
        window.Report = Report;
    }

    return Report;
}));