/**
 * Created by rainszhang on 14-1-16.
 */
LBF.define('monitor.SpeedReport', function(require){
    var report = require('util.report'),
        Class = require('lang.Class'),
        serialize = require('util.serialize'),
        Attribute = require('util.Attribute');

    var defaults = {
        url: '//isdspeed.qq.com/cgi-bin/r.cgi',
        rate: 1,
        calGap: false
    };

    var PointReport = Class.inherit(Attribute, {
        initialize: function(options){
            this
                .set(defaults)
                .set({
                    points: [],
                    start: +new Date()
                })
                .set(options);
        },

        add: function(time, pos){
            var points = this.get('points');

            time = time || +new Date();
            pos = pos || points.length;

            points[pos] = time;

            return this;
        },

        send: function(){
            // clear points
            var points = this.get('points').splice(0);

            if(Math.random() > this.get('rate')){
                return this;
            }

            var start = this.get('start'),
                f1 = this.get('flag1'),
                f2 = this.get('flag2'),
                f3 = this.get('flag3'),
                url = this.get('url') + '?flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&',
                proxy = this.get('proxy'),
                i;

            if(this.get('calGap')){
                for(i= points.length - 1; i> 0; i--){
                    points[i-1] = points[i-1] || 0;
                    points[i] -= points[i-1];
                }
            } else {
                for(i= points.length - 1; i> 0; i--){
                    if(points[i]){
                        points[i] -= start;
                    }
                }
            }

            url = url + serialize(points);

            // when use proxy mode
            if(proxy){
                url = proxy.replace('{url}', encodeURIComponent(url));
            }

            report(url);
        }
    });

    /**
     * 上报Performance timing数据；
     * 如果某个时间点花费时间为0，则此时间点数据不上报。
     *
     * @param {Object} options
     *
     * @param {String} options.flag1，测速系统中的业务ID，譬如校友业务为164
     *
     * @param {String} options.flag2，测速的站点ID
     *
     * @param {String} options.flag3IE，测速的页面ID
     *（因为使用过程中我们发现IE9的某些数据存在异常，
     * 如果IE9和chrome合并统计，会影响分析结果，所以这里建议分开统计）
     *
     * @param {String} [options.flag3Chrome]，测速的页面ID
     * （如果为空，则IE9和chrome合并统计）
     *
     * @param {Number} [options.initTime] 统计页面初始化时的时间
     *
     */
    var reportPerformance = function(options){
        var f1 = options.flag1,
            f2 = options.flag2,
            f3_ie = options.flag3IE,
            f3_c = options.flag3Chrome,
            d0 = options.initTime,
            proxy = options.proxy,
            defaultUrl = '//isdspeed.qq.com/cgi-bin/r.cgi';

        var _t, _p = window.performance || window.webkitPerformance || window.msPerformance, _ta = ["navigationStart","unloadEventStart","unloadEventEnd","redirectStart","redirectEnd","fetchStart","domainLookupStart","domainLookupEnd","connectStart","connectEnd","requestStart",/*10*/"responseStart","responseEnd","domLoading","domInteractive","domContentLoadedEventStart","domContentLoadedEventEnd","domComplete","loadEventStart","loadEventEnd"], _da = [], _t0, _tmp, f3 = f3_ie;

        if(Math.random() > options.rate){
            return this;
        }

        if (_p && (_t = _p.timing)) {

            if (typeof(_t.msFirstPaint) != 'undefined') {	//ie9
                _ta.push('msFirstPaint');
            } else {
                if (f3_c) {
                    f3 = f3_c;
                }
            }

            _t0 = _t[_ta[0]];
            for (var i = 1, l = _ta.length; i < l; i++) {
                _tmp = _t[_ta[i]];
                _tmp = (_tmp ? (_tmp - _t0) : 0);
                if (_tmp > 0) {
                    _da.push( i + '=' + _tmp);
                }
            }

            if (d0) {//统计页面初始化时的d0时间
                _da.push('30=' + (d0 - _t0));
            }

            //如果业务侧传递了url，则使用此url
            var url = options.url || defaultUrl;
            var url = url + '?flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + _da.join('&');

            // when use proxy mode
            if(proxy){
                url = proxy.replace('{url}', encodeURIComponent(url));
            }

            report(url);
        }

    };

    /**
     * 上报Performance timing数据；
     * 如果某个时间点花费时间为0，则此时间点数据不上报。
     *
     * @param {Object} options
     *
     * @param {String} options.flag1，测速系统中的业务ID，譬如校友业务为164
     *
     * @param {String} options.flag2，测速的站点ID
     *
     * @param {String} options.flag3IE，测速的页面ID
     *（因为使用过程中我们发现IE9的某些数据存在异常，
     * 如果IE9和chrome合并统计，会影响分析结果，所以这里建议分开统计）
     *
     * @param {String} [options.flag3Chrome]，测速的页面ID
     * （如果为空，则IE9和chrome合并统计）
     *
     * @param {Number} [options.initTime] 统计页面初始化时的时间
     *
     */
    var reportPerform = function(options){
        var f1 = options.flag1,
            f2 = options.flag2,
            f3_ie = options.flag3IE,
            f3_c = options.flag3Chrome,
            d0 = options.initTime,
            proxy = options.proxy,
            defaultUrl = location.protocol.indexOf('https') !== -1 ? '//huatuospeed.weiyun.com/cgi-bin/r.cgi' : '//isdspeed.qq.com/cgi-bin/r.cgi';

        var _t, _p = window.performance || window.webkitPerformance || window.msPerformance, _ta = ["navigationStart","unloadEventStart","unloadEventEnd","redirectStart","redirectEnd","fetchStart","domainLookupStart","domainLookupEnd","connectStart","connectEnd","requestStart",/*10*/"responseStart","responseEnd","domLoading","domInteractive","domContentLoadedEventStart","domContentLoadedEventEnd","domComplete","loadEventStart","loadEventEnd"], _da = [], _t0, _tmp, f3 = f3_ie;

        if(Math.random() > this.get('rate')){
            return this;
        }

        if (_p && (_t = _p.timing)) {

            if (typeof(_t.msFirstPaint) != 'undefined') {   //ie9
                _ta.push('msFirstPaint');
            } else {
                if (f3_c) {
                    f3 = f3_c;
                }
            }

            _t0 = _t[_ta[0]];
            for (var i = 1, l = _ta.length; i < l; i++) {
                _tmp = _t[_ta[i]];
                _tmp = (_tmp ? (_tmp - _t0) : 0);
                if (_tmp > 0) {
                    _da.push( i + '=' + _tmp);
                }
            }

            if (d0) {//统计页面初始化时的d0时间
                _da.push('30=' + (d0 - _t0));
            }

            var url = options.url || defaultUrl;

            url += '?flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + _da.join('&');

            // when use proxy mode
            if(proxy){
                url = proxy.replace('{url}', encodeURIComponent(url));
            }

            report(url);
        }

    };

    return {
        create: function(options){
            return new PointReport(options);
        },

        reportPerformance: reportPerformance,

        reportPerform: reportPerform
    }
});/**
 * @fileOverview
 * @author yangye & rainszhang
 * Created: 16-03-14
 */
LBF.define('qd/js/component/login.a4de6.js', function (require, exports, module) {
    var
        Cookie = require('util.Cookie'),
        JSON = require('lang.JSON'),
        QLogin = require('common.login.qidian');

    var Login = {
        /**
         * 登录成功后回调
         * @method init
         */
        init: function () {
            var that = this;
            var env = g_data ? (g_data.envType ? (g_data.envType == 'pro' ? '': g_data.envType) : '') : '';

            //创建defer对象
            var loginDefer = $.Deferred();

            //如果有登录态则执行登录成功回调，否则初始化qidian login来checkstatus
            var gLoginDefer = this.qLoginDefer = QLogin.init();
            gLoginDefer.done(function(){
                that.loginOnSuccess();
            });

            gLoginDefer.always(function(){
                loginDefer.resolve();
            });

            //有登录态的情况直接执行成功逻辑
            if(QLogin.isLogin()){
                that.loginOnSuccess();
            }

            //登录成功
            QLogin.setCallback('success',this,this.loginOnSuccess);

            //退出登录
            QLogin.setCallback('logout',this,this.logoutCallback);

            //绑定登录按钮，弹出登录弹窗
            $('#login-btn, #pin-login').on('click',function(){
                Login.showLoginPopup({
                    returnurl: location.protocol + '//' + env + 'www.qidian.com/loginSuccess?surl=' + encodeURIComponent(location.href)
                });
            });

            //绑定登录按钮，弹出登录弹窗
            $('#exit-btn, #exit').on('click',function(){
                Login.logout();
            });

            return loginDefer.promise();
        },


        //获取qlogindefer，方便之后其他页面调用，设置done方法
        getQloginDefer: function(){
            return this.qLoginDefer;
        },
        /**
         * 提供方法让业务侧设置自己的登录成功回调
         * @method setSuccess
         */
        setSuccess:function(that, callback){
            QLogin.setCallback('success',that,callback);
        },

        /**
         * 提供方法让业务侧设置自己的关闭登录弹窗回调
         * @method setClose
         */
        setClose:function(that, callback){
            QLogin.setCallback('close',that,callback);
        },

        /**
         * 提供方法让业务侧设置自己的登出回调
         * @method setLogout
         */
        setLogout:function(that, callback){
            QLogin.setCallback('logout',that,callback);
        },

        /**
         * 登录成功回调
         * @method loginOnSuccess
         */
        loginOnSuccess:function(){
            QLogin.hideLoginIfr();
            this.getUserMsg();
        },

        /**
         * 关闭登录弹窗回调
         * @method loginOnClose
         */
        loginOnClose:function(){
            QLogin.hideLoginIfr();
        },

        /**
         * 未登录状态，登录成功拉取用户信息
         * @method getUserMsg
         */
        getUserMsg: function () {
            $.ajax({
                url: '/ajax/UserInfo/GetUserInfo',
                //允许请求头带加密信息
                xhrFields: {
                    withCredentials: true
                }
            }).done(function (data) {
                if (data.code === 0) {
                    $('#msg-box').show();
                    $('.sign-in').removeClass('hidden');
                    $('.sign-out').addClass('hidden');
                    //获取用户名
                    var userName = data.data.nickName;
                    //全局化用户名，书详情页需要使用
                    window.userName = userName;
                    $('#user-name, #nav-user-name').text(userName);
                    if (data.data.msgCnt == 0) {
                        $('#msg-btn').find('i').addClass('black');
                    }
                    $('#msg-btn').find('i').text(data.data.msgCnt);
                    $('#top-msg').text(data.data.msgCnt);

                    //注释保留，今后可能会再做新手任务逻辑
                    //有登录头的页面、并且能拿到用户注册时间才请求判断是否显示新手任务
                    /*if ($('.top-nav').length == 1 && Cookie.get('rt')) {
                        //拉取cookie判断是否是新用户
                        //获取用户的注册时间，系统时间，准备做计算
                        curTime = new Date().getTime();
                        //拿到cookie里用户注册时间，火狐下需要把-换成“/”
                        var userTime = Cookie.get('rt').replace(/-/g, "/");
                        var newUserTime = parseInt(new Date(userTime).getTime());
                        var oneMonth = 86400000 * 30;
                        //判断是否新用户，然后获取新手任务状态
                        if ((curTime - newUserTime) < oneMonth) {
                            var newUserWrap = $('#new-user');
                            var newUserTip = $('#new-user-tip');
                            $.ajax({
                                url: '/activity/ajax/NewUser/GetUserTask'
                            }).done(function (data) {
                                if (data.code === 0) {
                                    //获取抽奖状态，：0没有抽奖机会，1有抽奖机会，2已领奖
                                    var userChancePrize = data.data.userChancePrize;
                                    //获取有多少个奖品未领取
                                    var userChanceAccept = data.data.userChanceAccept;
                                    //获取已经领奖的次数
                                    var haveAccepted = data.data.haveAccepted;
                                    //先判断领奖状态和数量，如果领奖数量小于等于0，表示没有奖品可领取，再去判断是否有抽奖机会
                                    if (userChancePrize === 1) {
                                        //判断抽奖状态，显示对应的信息
                                        newUserWrap.show();
                                        newUserTip.html('您有<i>1</i>次抽奖机会');
                                    } else if (userChanceAccept > 0) {
                                        newUserWrap.show();
                                        newUserTip.html('您有<i>' + userChanceAccept + '</i>个奖励未领取');
                                    } else if (haveAccepted >= 3 && userChancePrize == 2 && userChanceAccept == 0) {
                                        $('#new-user').remove();
                                    } else {
                                        newUserWrap.show();
                                    }
                                }
                            });
                        }
                    }*/
                }
            });
        },

        /**
         * 弱登录态时拉取用户信息
         * @method weekLoginStatus
         */
        weekLoginStatus: function () {
            $('#msg-box').hide();
            var loginInfo = {};
            var userInfo = '';
            var cookieRaw = document.cookie.split(';');
            for (i = 0; i < cookieRaw.length; i++) {
                var cur = cookieRaw[i].split('=');
                var keyName = cur[0].replace(/ /g, "");
                loginInfo[keyName] = cur[1];
                if (keyName == 'mdltk') {
                    userInfo = cur.join('=');
                }
            }
            var _userName = decodeURIComponent(userInfo.split('&')[1].split('=').pop());
            var bookShelf = parseInt(Cookie.get('bsc'));

            $('.sign-in').removeClass('hidden');
            $('.sign-out').addClass('hidden');
            $('#user-name, #nav-user-name').text(_userName);
        },

        /**
         * 退出登录-默认逻辑
         * @method logoutCallback
         */
        logoutCallback: function () {
            $('.sign-in').addClass('hidden');
            $('.sign-out').removeClass('hidden');
            $('#shelf-num, #pin-shelf').hide().text('');
            $('#web-dropdown').find('.not-logged').show().end().find('.logged-in').hide();
            location.reload();
        },

        /**
         * 触发退出登录的请求
         * @method goLogout
         */
        logout:function(){
            QLogin.goLogout();
        },
        /**
         * 展示登录弹窗
         * @method showLoginPopup
         */
        showLoginPopup:function(params){
            var env = g_data ? (g_data.envType ? (g_data.envType == 'pro' ? '': g_data.envType) : '') : '';
            QLogin.showPCLogin({ returnurl: location.protocol + '//' + env + 'www.qidian.com/loginSuccess?surl=' + encodeURIComponent(location.href)});
        },

        //是否登录了
        isLogin: function(){
            return QLogin.isLogin();
        }
    };

    window.Login = Login;
    return Login
});

/**
 * @fileOverview
 * @author  yangye
 * Created: 2016-4-14
 */
LBF.define('qd/js/search/index.83974.js', function(require, exports, module) {
    var
        Node = require('ui.Nodes.Node'),
        ajaxSetting = require('qd/js/component/ajaxSetting.84b88.js'),
        Header = require('qd/js/component/header.157aa.js'),
        Pagination = require('ui.Nodes.Pagination'),
        PinNav = require('qd/js/component/pinNav.34253.js'),
        Cookie = require('util.Cookie'),
        Url = require('qd/js/component/url.c4960.js'),
        ComboBox = require('ui.widget.ComboBox.ComboBox'),
        Addbook = require('qd/js/free/addBook.83d23.js'),
        Common = require('qd/js/component/common.08bc6.js'),
        report = require('qidian.report');


        // jquery visible plugin
    !function(t){var i=t(window);t.fn.visible=function(t,e,o){if(!(this.length<1)){var r=this.length>1?this.eq(0):this,n=r.get(0),f=i.width(),h=i.height(),o=o?o:"both",l=e===!0?n.offsetWidth*n.offsetHeight:!0;if("function"==typeof n.getBoundingClientRect){var g=n.getBoundingClientRect(),u=g.top>=0&&g.top<h,s=g.bottom>0&&g.bottom<=h,c=g.left>=0&&g.left<f,a=g.right>0&&g.right<=f,v=t?u||s:u&&s,b=t?c||a:c&&a;if("both"===o)return l&&v&&b;if("vertical"===o)return l&&v;if("horizontal"===o)return l&&b}else{var d=i.scrollTop(),p=d+h,w=i.scrollLeft(),m=w+f,y=r.offset(),z=y.top,B=z+r.height(),C=y.left,R=C+r.width(),j=t===!0?B:z,q=t===!0?z:B,H=t===!0?R:C,L=t===!0?C:R;if("both"===o)return!!l&&p>=q&&j>=d&&m>=L&&H>=w;if("vertical"===o)return!!l&&p>=q&&j>=d;if("horizontal"===o)return!!l&&m>=L&&H>=w}}}}(jQuery);

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
            'click .add-book': 'addToBookShelf',
            'click .sort-switcher a': 'switchSortType',
            'click .J_filter_item':'selectCondition',
            'click .J_remove_item':'removeCondition'
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
        render: function() {

            // 设置UI Node proxy对象，chainable method，勿删
            this.setElement(this.el);

            // 页面逻辑入口
            this.init();

            setInterval(function() {
                $('.res-book-item').each(function(i, dom) {
                    if (!$(dom).data('report') && $(dom).visible()) {
                        $(dom).data('report', true)
                        var bid = $(dom).data('bid');
                        
                        report.sendParams({
                            l1: 3,
                            ltype: 'P',
                            eid: 'qd_S82',
                            bid: bid
                        })
                    }
                })
            }, 100)
            // 返回组件
            return this;
        },

        /**
         * 页面逻辑入口
         */
        init: function() {
            var that = this;

            //页面load时发送通用请求
            var env = g_data.envType == 'pro'? '':g_data.envType;
            this.common = new Common();

            //header.js
            var header = new Header({});

            //pinNav.js
            var pinNav = new PinNav({});

            //初始化分页
            this.pagiNation();

            //获取当前url
            this._curentUrl = location.href;

            //页面加载成功后发送智能推荐相关上报请求
            $(window).load(function(){
                that.reportUserRecomData();
            });

            //初始化combobox
            this.initVipClicksCombobox();
            this.initRecommCombobox();

        },

        /*
         **上报智能推荐相关数据
         * @method reportUserRecomData
         */
        reportUserRecomData:function(){
            var envType = g_data.envType;
            if(g_data.envType == 'pro'){
                envType = '';
            }
            //是否显示了‘搜这本书的还搜’
            var hasRightPart = g_data.hasRightRecomData;
            //是否在无结果的时候显示了页面下方的‘为你推荐’
            var hasBotPart = g_data.hasBotRecomData;
            //是否有搜索结果
            var hasSearchData = g_data.hasSearchData;
            //初始化变量
            var bidStr,bidStr2,algStr,algStr2,reportUrl,reportUrl2;
            var bidArr = [],bidArr2 = [],algArr = [],algArr2 = [];
            var uid = Cookie.get('qduid')||Cookie.get('stat_sessid')||-1;
            var time =  g_data.currTime;
            var page = parseInt($('#page-container').attr('data-page'))||0;
            var kw = $('#s-box').val()||'';

            //获取目前展示的智能推荐list
            if(hasRightPart){
                var bookList = $('.right-side-wrap ul .img-box a');
            }
            if(hasBotPart){
                var bookList = $('#result-list ul .book-img-box a');
            }
            if(hasSearchData){
                var resultList = $('#result-list ul .book-img-box a');
                $.each(resultList,function(idx,value){
                    bidArr2.push($(value).data('bid')||'');
                    algArr2.push($(value).data('algrid')||'');
                });
                bidStr2 = bidArr2.join(',');
                algStr2 = algArr2.join(',');
                reportUrl2 = '//'+ envType +'www.qidian.com/qreport?time='+ time +'&platform=qdpc&qd_userid='+ uid +'&ltype=E&algrid='+ algStr2 +'&kw='+ kw +'&start='+ page +'&bid='+ bidStr2;
                this.common.createSender(reportUrl2);
            }

            //拼接bid字符串，最后以逗号隔开
            if(bookList){
                $.each(bookList,function(idx,value){
                    bidArr.push($(value).data('bid')||'');
                    algArr.push($(value).data('algrid')||'');
                });
                bidStr = bidArr.join(',');
                algStr = algArr.join(',');
                reportUrl = '//'+ envType +'www.qidian.com/qreport?ltype=E&platform=qdpc&bid='+ bidStr +'&qd_userid='+ uid +'&algrid='+ algStr;
                //发送请求
                this.common.createSender(reportUrl);
            }
        },

        /*
         **加入书架
         * @method addToBookShelf
         */
        addToBookShelf: function(e) {
            //引用Addbook.js中的加入书架方法
            Addbook.addToBookShelf(e, 'blue-btn', 'in-shelf');
        },

        /*
         **更换排序类型
         * @method switchSortType
         */
        switchSortType: function(e) {
            var _this = $(e.currentTarget);
            if(_this.hasClass('lbf-combobox-label')){
                return;
            }
            var _currentSortType = _this.attr('data-type');
            console.log(_currentSortType);
            var _updateType = 1;

            switch (_currentSortType) {
                case 'time':
                    _updateType = 1;
                    break;
                case 'wordscnt':
                    _updateType = 4;
                    break;
                case 'totalCollect':
                    _updateType = 11;
                    break;
                case 'popularity':
                    _updateType = '';
                    break;
            }
            var _updateUrl = Url.setParam(this._curentUrl,'sort',_updateType);
            _updateUrl = Url.setParam(_updateUrl,'page',1);
            location.href = _updateUrl;

        },

        /**
         * 分页
         * @method pagiNation
         */
        pagiNation: function() {
            var that = this;
            var pagination = new Pagination({
                container: '#page-container',
                startPage: 1,
                endPage: parseInt($('#page-container').attr('data-pageMax')),
                page: parseInt($('#page-container').attr('data-page')),
                isShowJump: true,
                headDisplay: 1,
                tailDisplay: 1,
                prevText: '&lt;',
                nextText: '&gt;',
                events: {
                    'change:page': function(e, page) {
                        that.currentPage = page;
                        var _curentUrl = location.href;
                        var _updateUrl = Url.setParam(_curentUrl, 'page', that.currentPage);
                        console.log('更新' + _updateUrl);
                        location.href = _updateUrl;
                    }
                }
            });
        },

        /**
         * 设置筛选条件
         * @method selectCondition
         * @param e 事件对象
         */
        selectCondition: function (e) {
            var that = this;
            var item = $(e.currentTarget);
            var filterType = item.attr('data-type');
            var siteId,chanId,actionId,vipId,sizeId,signId,updateId;
            //最终带有参数的URL
            var finalUrl = '',_finalUrl = '';
            //根据筛选项的类型添加不同参数值
            switch (filterType) {
                case 'site':
                    siteId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'siteid', siteId);
                    break;
                case 'category':
                    chanId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'chanId', chanId);
                    break;
                case 'action':
                    actionId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'action', actionId);
                    break;
                case 'vip':
                    vipId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'vip', vipId);
                    break;
                case 'size':
                    sizeId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'size', sizeId);
                    break;
                case 'sign':
                    signId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'sign', signId);
                    break;
                case 'update':
                    updateId = parseInt(item.attr('data-id'));
                    _finalUrl = Url.setParam(that._curentUrl, 'update', updateId);
                    break;
            }
            //重置参数后，需要将页面跳转到第一页
            finalUrl = Url.setParam(_finalUrl, 'page', 1);
            //刷新页面
            location.href = finalUrl;
        },

        /**
         * 移除筛选条件
         * @method selectCondition
         * @param e 事件对象
         */
        removeCondition: function (e) {
            var that = this;
            var item = $(e.currentTarget);
            var filterType = item.attr('data-type');
            //最终的url
            var finalUrl = '',_finalUrl = '';
            switch (filterType) {
                case 'site':
                    _finalUrl = Url.setParam(that._curentUrl, 'siteid', '');
                    break;
                case 'category':
                    _finalUrl = Url.setParam(that._curentUrl, 'chanId', '');
                    break;
                case 'action':
                    _finalUrl = Url.setParam(that._curentUrl, 'action', '');
                    break;
                case 'vip':
                    _finalUrl = Url.setParam(that._curentUrl, 'vip','');
                    break;
                case 'size':
                    _finalUrl = Url.setParam(that._curentUrl, 'size', '');
                    break;
                case 'sign':
                    _finalUrl = Url.setParam(that._curentUrl, 'sign','');
                    break;
                case 'update':
                    _finalUrl = Url.setParam(that._curentUrl, 'update','');
                    break;
            }
            //重置参数后，需要将页面跳转到第一页
            finalUrl = Url.setParam(_finalUrl, 'page', 1);
            //刷新页面
            location.href = finalUrl;
        },

        /**
         * 初始化combobox
         * @method initVipClicksCombobox
         */
        initVipClicksCombobox:function(){
            var sortId = parseInt($('.select-wrap').attr('data-sort'));
            var options = [
                {
                    text:'会员点击',
                    value:'0'
                },
                {
                    text:'会员周点击',
                    value:'2'
                },
                {
                    text:'会员月点击',
                    value:'7'
                },
                {
                    text:'会员总点击',
                    value:'8'
                }
            ];

            //当前sort数值对应options数组中的index
            var selectedIndex;
            switch(sortId){
                case 2:
                    selectedIndex = 1;
                    break;
                case 7:
                    selectedIndex = 2;
                    break;
                case 8:
                    selectedIndex = 3;
                    break;
                default:
                    selectedIndex = 0;
                    break;
            }

            //初始化checkbox
            this.initComboBox('#vipClicks','vipClicks','会员点击',options, selectedIndex);
        },
        //initVipClicksCombobox:function(){
        //    var that = this;
        //    var sortId = parseInt($('.select-wrap').attr('data-sort'));
        //    var targetElement = $('.vipClicks .lbf-combobox-caption');
        //    var selectedIndex;
        //    switch(sortId){
        //        case 2:
        //            selectedIndex = 1;
        //            break;
        //        case 7:
        //            selectedIndex = 2;
        //            break;
        //        case 8:
        //            selectedIndex = 3;
        //            break;
        //        default:
        //            selectedIndex = 0;
        //            break;
        //    }
        //    this.vipClicks = new ComboBox({
        //        selector: $('#vipClicks'),
        //        className: 'vipClicks',
        //        maxDisplay: 15,
        //        width:'auto',
        //        options:[
        //            {
        //                text:'会员点击',
        //                value:'0'
        //            },
        //            {
        //                text:'会员周点击',
        //                value:'2'
        //            },
        //            {
        //                text:'会员月点击',
        //                value:'7'
        //            },
        //            {
        //                text:'会员总点击',
        //                value:'8'
        //            }
        //        ],
        //        selectedIndex:selectedIndex,
        //        optionPanelTemplate: [
        //            '<ul class="lbf-combobox-options">',
        //            '<% for(var i=0,len=options.length; i<len; i++){ %>',
        //            '<li class="lbf-combobox-option"><a class="lbf-combobox-item" href="javascript:;" data-value="<%== options[i].value %>"><%= options[i].text %></a></li>',
        //            '<% }%>',
        //            '</ul>'
        //        ].join(''),
        //        selectTemplate: [
        //            '<div class="lbf-combobox">',
        //            '<a href="javascript:;" class="lbf-button lbf-combobox-label <%if(options[selectedIndex].text != "会员点击"){%>act<%}%>" data-value="<%== options[selectedIndex].value %>" hidefocus="true">',
        //            '<span class="lbf-combobox-caption"><%= options[selectedIndex].text %></span>',
        //            '<%if(options[selectedIndex].text != "会员点击"){%><cite class="iconfont">&#xe625;</cite><%}%>',
        //            '<span class="lbf-icon lbf-icon-down lbf-combobox-icon"></span>',
        //            '</a>',
        //            '</div>'
        //        ].join(''),
        //        events: {
        //            'change:value': function(e,newV,oldV) {
        //                //初始化组件时候会有可能将组件值重置为value 0对应的选项，为防止循环刷新页面，此处做Hack
        //                if(newV == 0){
        //                    return;
        //                }
        //
        //                //手动上报
        //                switch(parseInt(newV)){
        //                    case 2:
        //                        report.send(e,{l1:6,eid:'qd_S66'});
        //                        break;
        //                    case 7:
        //                        report.send(e,{l1:6,eid:'qd_S76'});
        //                        break;
        //                    case 8:
        //                        report.send(e,{l1:6,eid:'qd_S77'});
        //                        break;
        //                }
        //
        //                //更新参数值并刷新页面
        //                var _updateUrl = Url.setParam(that._curentUrl,'sort',newV);
        //                _updateUrl = Url.setParam(_updateUrl,'page',1);
        //                location.href = _updateUrl;
        //            }
        //        }
        //    });
        //    //当caption是请选择字样，则移除option中的请选择选项，否则将val更新为值为当前caption的选项
        //    if(selectedIndex == 0){
        //        this.vipClicks.val(0);
        //    }else{
        //        targetElement.parent().addClass('act');
        //    }
        //    this.vipClicks.removeOptionByValue('0');
        //},

        initRecommCombobox:function(){
            var that = this;
            var sortId = parseInt($('.select-wrap').attr('data-sort'));
            //需要有默认选项
            var options = [
                {
                    text:'推荐票',
                    value:'0'
                },
                {
                    text:'周推荐票',
                    value:'9'
                },
                {
                    text:'月推荐票',
                    value:'10'
                },
                {
                    text:'总推荐票',
                    value:'3'
                }
            ];

            //当前sort数值对应options数组中的index
            var selectedIndex;
            switch(sortId){
                case 9:
                    selectedIndex = 1;
                    break;
                case 10:
                    selectedIndex = 2;
                    break;
                case 3:
                    selectedIndex = 3;
                    break;
                default:
                    selectedIndex = 0;
                    break;
            }

            //初始化checkbox
            this.initComboBox('#recomm','recomm','推荐票',options, selectedIndex);
        },

        /**
         * 初始化combobox
         * @method initRecommCombobox
         */
        //initRecommCombobox:function(){
        //    var that = this;
        //    var selectedIndex;
        //    var sortId = parseInt($('.select-wrap').attr('data-sort'));
        //    switch(sortId){
        //        case 9:
        //            selectedIndex = 1;
        //            break;
        //        case 10:
        //            selectedIndex = 2;
        //            break;
        //        case 3:
        //            selectedIndex = 3;
        //            break;
        //        default:
        //            selectedIndex = 0;
        //            break;
        //
        //    }
        //
        //    var targetElement = $('.recomm .lbf-combobox-caption');
        //    this.recomm = new ComboBox({
        //        selector: $('#recomm'),
        //        className: 'recomm',
        //        maxDisplay: 15,
        //        options:[
        //            {
        //                text:'推荐票',
        //                value:'0'
        //            },
        //            {
        //                text:'周推荐票',
        //                value:'9'
        //            },
        //            {
        //                text:'月推荐票',
        //                value:'10'
        //            },
        //            {
        //                text:'总推荐票',
        //                value:'3'
        //            }
        //        ],
        //        selectedIndex:selectedIndex,
        //        optionPanelTemplate: [
        //            '<ul class="lbf-combobox-options">',
        //            '<% for(var i=0,len=options.length; i<len; i++){ %>',
        //            '<li class="lbf-combobox-option"><a class="lbf-combobox-item" href="javascript:;" data-value="<%== options[i].value %>"><%= options[i].text %></a></li>',
        //            '<% }%>',
        //            '</ul>'
        //        ].join(''),
        //        selectTemplate: [
        //            '<div class="lbf-combobox">',
        //            '<a href="javascript:;" class="lbf-button lbf-combobox-label <%if(options[selectedIndex].text != "推荐票"){%>act<%}%>" data-value="<%== options[selectedIndex].value %>" hidefocus="true">',
        //            '<span class="lbf-combobox-caption"><%= options[selectedIndex].text %></span>',
        //            '<%if(options[selectedIndex].text != "推荐票"){%><cite class="iconfont">&#xe625;</cite><%}%>',
        //            '<span class="lbf-icon lbf-icon-down lbf-combobox-icon"></span>',
        //            '</a>',
        //            '</div>'
        //        ].join(''),
        //        events: {
        //            'change:value': function(e,newV,oldV) {
        //                //初始化组件时候会有可能将组件值重置为value 0对应的选项，为防止循环刷新页面，此处做Hack
        //                if(newV == 0){
        //                    return;
        //                }
        //
        //                //手动上报
        //                switch(parseInt(newV)){
        //                    case 9:
        //                        report.send(e,{l1:6,eid:'qd_S79'});
        //                        break;
        //                    case 10:
        //                        report.send(e,{l1:6,eid:'qd_S78'});
        //                        break;
        //                    case 3:
        //                        report.send(e,{l1:6,eid:'qd_S67'});
        //                        break;
        //                }
        //
        //                //更新参数值并刷新页面
        //                var _updateUrl = Url.setParam(that._curentUrl,'sort',newV);
        //                _updateUrl = Url.setParam(_updateUrl,'page',1);
        //                location.href = _updateUrl;
        //            }
        //        }
        //    });
        //    //当caption是请选择字样，则移除option中的请选择选项，否则将val更新为值为当前caption的选项
        //    if(selectedIndex == 0){
        //        this.recomm.val(0);
        //    }else{
        //        targetElement.parent().addClass('act');
        //    }
        //    this.recomm.removeOptionByValue('0');
        //},

        /**
         * 初始化combobox -- 通用方法
         * @method initComboBox
         * @param selector combobox容器的选择符，一般为id
         * @param className combobox生成后保留的类名，一般为class
         * @param defaultText 默认展示的文字，类似 '请选择'
         * @param options combobox所需options数组
         * @param selectIdx combobox容器的选择符，可以是id或class
         */
        initComboBox:function(selector, className, defaultText, options, selectIdx){
            var that = this;
            var targetElement = $('.recomm .lbf-combobox-caption');
            var combo = new ComboBox({
                selector: $(selector),
                className: className,
                maxDisplay: 15,
                options: options,
                selectedIndex:selectIdx,
                value:options[selectIdx].value,
                optionPanelTemplate: [
                    '<ul class="lbf-combobox-options">',
                    '<% for(var i=0,len=options.length; i<len; i++){ %>',
                    '<li class="lbf-combobox-option"><a class="lbf-combobox-item" href="javascript:;" data-value="<%== options[i].value %>"><%= options[i].text %></a></li>',
                    '<% }%>',
                    '</ul>'
                ].join(''),
                selectTemplate: [
                    '<div id="'+ selector +'" class="lbf-combobox">',
                    '<a href="javascript:;" class="lbf-button lbf-combobox-label <%if(options[selectedIndex].text != "'+ defaultText +'"){%>act<%}%>" data-value="<%== options[selectedIndex].value %>" hidefocus="true">',
                    '<span class="lbf-combobox-caption"><%= options[selectedIndex].text %></span>',
                    '<%if(options[selectedIndex].text != "'+ defaultText +'"){%><cite class="iconfont">&#xe625;</cite><%}%>',
                    '<span class="lbf-icon lbf-icon-down lbf-combobox-icon"></span>',
                    '</a>',
                    '</div>'
                ].join(''),
                events: {
                    'change:value': function(e,newV,oldV) {
                        //初始化组件时候会有可能将组件值重置为value 0对应的选项，为防止循环刷新页面，此处做Hack
                        if(newV == 0){
                            return;
                        }

                        //手动上报
                        switch(parseInt(newV)){
                            //推荐票
                            case 9:
                                report.send(e,{l1:6,eid:'qd_S79'});
                                break;
                            case 10:
                                report.send(e,{l1:6,eid:'qd_S78'});
                                break;
                            case 3:
                                report.send(e,{l1:6,eid:'qd_S67'});
                                break;
                            //会员点击
                            case 2:
                                report.send(e,{l1:6,eid:'qd_S66'});
                                break;
                            case 7:
                                report.send(e,{l1:6,eid:'qd_S76'});
                                break;
                            case 8:
                                report.send(e,{l1:6,eid:'qd_S77'});
                                break;
                        }

                        //更新参数值并刷新页面
                        var _updateUrl = Url.setParam(that._curentUrl,'sort',newV);
                        _updateUrl = Url.setParam(_updateUrl,'page',1);
                        location.href = _updateUrl;
                    }
                }
            });
            //当caption是请选择字样，则移除option中的请选择选项，否则将val更新为值为当前caption的选项
            if(selectIdx == 0){
                combo.val(0);
            }else{
                targetElement.parent().addClass('act');
            }
            combo.removeOptionByValue('0');
        }
    })
});
/**
 * @fileOverview
 * @author amoschen
 * @version 1
 * Created: 13-4-2 下午9:19
 */
LBF.define('util.report', function(){
    var logs = {};

    /**
     * Report to a url
     * @class report
     * @namespace util
     * @module util
     * @constructor
     * @param {String} url Report destination. All data should be serialized and add tu search part of url
     * @chainable
     */
    return function(url){
        //send data
        var now = +new Date(),
            name = 'log_' + now,
            img = logs[name] = new Image();

        img.onload = img.onerror = function(){
            logs[name] = null;
        };

        url += (url.indexOf('?') > -1 ? '&' : '?') + now;

        img.src = url;

        return arguments.callee;
    };
});/**
 * Created by amos on 14-8-18.
 */
LBF.define('lang.Class', function(require, exports, module){
    var toArray = require('lang.toArray'),
        extend = require('lang.extend');

    /**
     * Base Class
     * @class Class
     * @namespace lang
     * @module lang
     * @constructor
     * @example
     *      // SubClass extends Class
     *      var SubClass = Class.extend({
     *          // overwritten constructor
     *          initialize: function(){
     *
     *          },
     *
     *          someMethod: function(){
     *          }
     *      });
     *
     *      // add static methods and attributes
     *      SubClass.include({
     *          staticMethod: function(){
     *          },
     *
     *          staticAttr: 'attrValue'
     *      });
     *
     *      // Extension is always available for sub class
     *      var SubSubClass = SubClass.extend({
     *          // methods to be extended
     *      });
     */
    module.exports = inherit.call(Function, {
        initialize: function(){},

        /**
         * Mix in methods and attributes. Instead of inherit from base class, mix provides a lighter way to extend object.
         * @method mixin
         * @since 0.5.2
         * @param {Object} [mixin]* The object to be mixed in
         * @chainable
         * @example
         *      var someInstance = new Class;
         *
         *      someInstance.mix({
         *          sayHello: function(){
         *              alert('hello');
         *          }
         *      });
         */
        mixin: include
    });

    function inherit(ext){
        // prepare extends
        var args = toArray(arguments);

        // constructor
        var Class = function(){
            // real constructor
            this.initialize.apply(this, arguments);
        };

        // copy Base.prototype
        var Base = function(){};
        Base.prototype = this.prototype;
        var proto = new Base();

        // correct constructor pointer
        /**
         * Instance's constructor, which initialized the instance
         * @property constructor
         * @for lang.Class
         * @type {lang.Class}
         */
        proto.constructor = Class;

        /**
         * Superclass of the instance
         * @property superclass
         * @type {lang.Class}
         */
        proto.superclass = this;

        // extends prototype
        args.unshift(proto);
        extend.apply(args, args);
        Class.prototype = proto;

        // add static methods
        extend(Class, {
            /**
             * Extend a sub Class
             * @method inherit
             * @static
             * @for lang.Class
             * @param {Object} [ext]* Prototype extension. Multiple exts are allow here.
             * @chainable
             * @example
             *     var SubClass = Class.extend(ext1);
             *
             * @example
             *      // multiple extensions are acceptable
             *      var SubClass = Class.extend(ext1, ext2, ...);
             */
            inherit: inherit,

            /**
             * Extend static attributes
             * @method include
             * @static
             * @for lang.Class
             * @param {Object} [included]* Static attributes to be extended
             * @chainable
             * @example
             *     Class.include(include1);
             *
             * @example
             *     // multiple includes are acceptable
             *     Class.include(include1, include2, ...);
             */
            include: include,

            /**
             * Inherit base class and add/overwritten some new methods or properties.
             * This is a deprecated method for it's easily misunderstood. It's just for backward compatible use and will be removed in the near future.
             * We recommend inherit for a replacement
             * @method extend
             * @static
             * @for lang.Class
             * @deprecated
             * @see inherit
             */
            extend: inherit,

            /**
             * Superclass the Class inherited from
             * @property superclass
             * @type {lang.Class}
             * @for lang.Class
             */
            superclass: this
        });

        return Class;
    };

    function include(included){
        var args = toArray(arguments);
        args.unshift(this);
        extend.apply(this, args);
        return this;
    }
});/**
 * Created by amos on 14-8-18.
 */
LBF.define('util.serialize', function(require, exports, module){
    /**
     * Serialize object with delimiter
     * @class serialize
     * @namespace util
     * @constructor
     * @param {Object} obj
     * @param {String} [delimiterInside='=']
     * @param {String} [delimiterBetween='&']
     * @return {String}
     */
    module.exports = function(obj, delimiterInside, delimiterBetween){
        var stack = [];
        delimiterInside = delimiterInside || '=';
        delimiterBetween = delimiterBetween || '&';

        for(var key in obj){
            if(obj.hasOwnProperty){
                stack.push(key + delimiterInside + (obj[key] || ''));
            }
        }

        return stack.join(delimiterBetween);
    };
});/**
 * Created by amos on 14-8-18.
 */
LBF.define('util.Attribute', function(require, exports, module){
    var extend = require('lang.extend');

    var ATTR = '_ATTRIBUTES',
        VALIDATES = '_VALIDATES';

    /**
     * [mixable] Common attributes handler. Can be extended to any object that wants event handler.
     * @class Attribute
     * @namespace util
     * @example
     *      // mix in instance example
     *      // assume classInstance is instance of lang.Class or its sub class
     *
     *      // use class's mix method
     *      classInstance.mix(Event);
     *
     *      // watch events
     *      classInstance.bind('someEvent', function(){
     *          // do sth
     *      });
     *
     * @example
     *      // extend a sub class example
     *
     *      // use class's extend method
     *      var SubClass = Class.extend(Event, {
     *          // some other methods
     *          method1: function(){
     *          },
     *
     *          method2: function(){
     *          }
     *      });
     *
     *      // initialize an instance
     *      classInstance = new SubClass;
     *
     *      // watch events
     *      classInstance.bind('someEvent', function(){
     *          // do sth
     *      });
     */


    /**
     * Set an attribute
     * @method set
     * @param {String} attr Attribute name
     * @param {*} value
     * @param {Object} options Other options for setter
     * @param {Boolean} [options.silence=false] Silently set attribute without fire change event
     * @chainable
     */
    exports.set = function(attr, val, options){
        var attrs = this[ATTR];

        if(!attrs){
            attrs = this[ATTR] = {};
        }

        if(typeof attr !== 'object'){
            var oAttr = attrs[attr];
            attrs[attr] = val;

            // validate
            if(!this.validate(attrs)){
                // restore value
                attrs[attr] = oAttr;
            } else {
                // trigger event only when value is changed and is not a silent setting
                if(val !== oAttr && (!options || !options.silence) && this.trigger){
                    /**
                     * Fire when an attribute changed
                     * Fire once for each change and trigger method is needed
                     * @event change:attr
                     * @param {Event} JQuery event
                     * @param {Object} Current attributes
                     */
                    this.trigger('change:' + attr, [attrs[attr], oAttr]);

                    /**
                     * Fire when attribute changed
                     * Fire once for each change and trigger method is needed
                     * @event change
                     * @param {Event} JQuery event
                     * @param {Object} Current attributes
                     */
                    this.trigger('change', [attrs]);
                }
            }

            return this;
        }

        // set multiple attributes by passing in an object
        // the 2nd arg is options in this case
        options = val;

        // plain merge
        // so settings will only be merged plainly
        var obj = extend({}, attrs, attr);

        if(this.validate(obj)){
            this[ATTR] = obj;
            // change event
            if((!options || !options.silence) && this.trigger){
                var changedCount = 0;
                for(var i in attr){
                    // has property and property changed
                    if(attr.hasOwnProperty(i) && obj[i] !== attrs[i]){
                        changedCount++;
                        this.trigger('change:' + i, [obj[i], attrs[i]]);
                    }
                }

                // only any attribute is changed can trigger change event
                changedCount > 0 && this.trigger('change', [obj]);
            }
        }

        return this;
    };

    /**
     * Get attribute
     * @method get
     * @param {String} attr Attribute name
     * @return {*}
     */
    exports.get = function(attr){
        return !this[ATTR] ? null : this[ATTR][attr];
    };

    /**
     * Get all attributes.
     * Be sure it's ready-only cause it's not a copy!
     * @method attributes
     * @returns {Object} All attributes
     */
    exports.attributes = function(){
        return this[ATTR] || {};
    };

    /**
     * Add validate for attributes
     * @method addValidate
     * @param {Function} validate Validate function, return false when failed validation
     * @chainable
     * @example
     *      instance.addValidate(function(event, attrs){
     *          if(attrs.someAttr !== 1){
     *              return false; // return false when failed validation
     *          }
     *      });
     */
    exports.addValidate = function(validate){
        var validates = this[VALIDATES];

        if(!validates){
            validates = this[VALIDATES] = [];
        }

        // validates for all attributes
        validates.push(validate);

        return this;
    };

    /**
     * Remove a validate function
     * @method removeValidate
     * @param {Function} validate Validate function
     * @chainable
     * @example
     *      instance.removeValidate(someExistValidate);
     */
    exports.removeValidate = function(validate){
        // remove all validates
        if(!validate){
            this[VALIDATES] = null;
            return this;
        }

        var valArr = this[VALIDATES];

        for(var i= 0, len= valArr.length; i< len; i++){
            if(valArr[i] === validate){
                valArr.splice(i, 1);
                --i;
                --len;
            }
        }

        return this;
    };

    /**
     * Validate all attributes
     * @method validate
     * @return {Boolean} Validation result, return false when failed validation
     */
    exports.validate = function(attrs){
        var valArr = this[VALIDATES];
        if(!valArr){
            return true;
        }

        attrs = attrs || this[ATTR];
        for(var i= 0, len= valArr.length; i< len; i++){
            if(valArr[i].call(this, attrs) === false){
                return false;
            }
        }

        return true;
    };
});/**
 * Created by amos on 14-8-18.
 */
LBF.define('lang.toArray', function(require, exports, module){
    /**
     * Make array like object to array
     * Usually for arguments, jQuery instance
     * @class toArray
     * @namespace lang
     * @constructor
     * @param {Object} arrayLike Array like object
     * @returns {Array}
     * @example
     *      var someFn = function(){
     *          var args = toArray(arguments);
     *      };
     */
    module.exports = function(arrayLike){
        return [].slice.call(arrayLike);
    };
});/**
 * Created by amos on 14-8-7.
 */
LBF.define('lang.extend', function(require, exports, module){
    var isPlainObject = require('lang.isPlainObject');

    /**
     * Extend(copy) attributes from an object to another
     * @class extend
     * @namespace lang
     * @constructor
     * @param {Boolean} [isRecursive=false] Recursively extend the object
     * @param {Object} base Base object to be extended into
     * @param {Object} ext* Object to extend base object
     * @example
     *      // plain extend
     *      // returns {a: 1, b:1}
     *      extend({a: 1}, {b: 1});
     *
     *      // recursive extend
     *      var b = { x: 1};
     *      var ret = extend(true, {}, { b: b});
     *      b.x = 2;
     *      b.x !== ret.b.x;
     */
    module.exports = function(isRecursive, base, ext){
        var args = [].slice.apply(arguments),
            o = args.shift(),
            extFn = plain;

        if(typeof o === 'boolean'){
            o = args.shift();
            o && (extFn = recursive);
        }

        for(var i= 0, len= args.length; i< len; i++){
            args[i] && extFn(o, args[i]);
        }

        return o;

        function plain(o, ext){
            for(var attr in ext){
                if(ext.hasOwnProperty(attr)){
                    o[attr] = ext[attr];
                }
            }
        }

        function recursive(o, ext){
            for(var attr in ext){
                if(ext.hasOwnProperty(attr)){
                    if(isPlainObject(ext[attr])){
                        o[attr] = o[attr] || {};
                        recursive(o[attr], ext[attr]);
                    } else{
                        o[attr] = ext[attr];
                    }
                }
            }
        }
    };
});LBF.define('lang.isPlainObject', function(require, exports, module){
    var isObject = require('lang.isObject'),
        isWindow = function(obj){
            return obj && obj === obj.window;
        };
        
    /**
     * Whether the obj is a plain object, not array or regexp etc.
     * @method isPlainObject
     * @static
     * @param {*} obj
     * @return {Boolean}
     */
    module.exports = function( obj ) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if ( !obj || !isObject(obj) || obj.nodeType || isWindow( obj ) ) {
            return false;
        }

        var hasOwn = Object.prototype.hasOwnProperty;

        try {
            // Not own constructor property must be Object
            if ( obj.constructor &&
                !hasOwn.call(obj, 'constructor') &&
                !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf') ) {
                return false;
            }
        } catch ( e ) {
            // IE8,9 Will throw exceptions on certain host objects #9897
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for ( key in obj ) {}

        return key === undefined || hasOwn.call( obj, key );
    };
});