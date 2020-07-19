/**
 * @fileOverview
 * @author renjiale
 * Created: 16-11-09
 */
(function(global, factory) {
    if (typeof define === 'function') {
        // 支持LBF加载
        if(typeof LBF === 'object'){
            LBF.define('common.login.qidian', function(){
                return factory(global);
            });
        }else{
            define(function() {
                return factory(global);
            });
        }
    } else {
        window.qdLogin = factory(global);
    }
}(this, function(window) {
    var $ = window.$ || window.jQuery || window.Zepto;

    // local & dev & oa 上报到一个错误的地址，方便自测、测试，起点通过g_data传参，其他项目默认就是直接post到运营环境了
    //var envType = (function(){
    //    try {
    //        return (g_data && g_data.envType || 'pro')  === 'pro' ||(g_data && g_data.envType || 'pro')  === 'pre' ?  '' : g_data.envType;
    //    } catch(e){
    //        return '';
    //    }
    //})();
    var envType = (function(){
        try {
            return  g_data.envType === 'pro' ? '': g_data.envType
        } catch(e){
            return '';
        }
    })();

    //登录及登出所需回调函数
    var callbacks = {};

    var qdLogin = {
        /**
         * 页面逻辑入口
         */
        init: function (isM) {
            this.httpHeader = location.protocol;
            //初始化各回调,登录失败,成功方法全局化于top属性,无默认回调则不设置
            callbacks['close'] = qdLogin._loginOnClose;
            window.top.qdlogin_onSuccess = callbacks['success'] = qdLogin._loginOnSuccess;
            window.top.qdlogin_onError = callbacks['error'] = qdLogin._loginOnError;

            //监听统一登录message
            qdLogin._receivePostMessage();

            return this.autoLogin(isM);
        },

        /**
         * 检测是否具有登录态
         * @method isLogin
         */
        isLogin: function(){
            if(Cookie.get('ywguid') && Cookie.get('ywkey')){
                return true;
            }else{
                return false;
            }
        },

        /**
         * 页面逻辑入口
         * @method _receivePostMessage
         */
        _receivePostMessage:function(){
            if (typeof window.postMessage !== 'undefined') {
                window.onmessage = function(event) {
                    var msg = event || window.event; // 兼容IE8
                    var data;

                    if (typeof  JSON !== 'undefined')
                        data = JSON.parse(msg.data);
                    else
                        data = this._str2JSON(msg.data);
                    //目前暂不支持resize事件
                    switch (data.action) {
                        case 'close':
                            callbacks['close'](data.data);
                            break;
                        default:
                            break;
                    }
                }
            } else { //ie6,ie7兼容代码
                navigator.ywlogin_callback = function(msg) {
                    data = this._str2JSON(msg.data);
                    //目前暂不支持resize事件
                    switch (data.action) {
                        case 'close':
                            callbacks['close'](data.data);
                            break;
                        default:
                            break;
                    }
                }
            }
        },

        /**
         * 设置环境变量
         * @method setEnv
         */
        setEnv:function(env){
            if(env) envType = env;
        },

        /**
         * 自动登录-弱登录态时自动登录
         * @method autoLogin
         */
        autoLogin:function(isM){
            //创建defer对象
            var checkLoginDefer;

            try{
                checkLoginDefer = $.Deferred();
            }catch(e){
                checkLoginDefer = null;
            }

            var that = this,
                body = $('body');

            //自动登录
            if (!Cookie.get('ywguid') && !Cookie.get('ywkey')) {
                //checkstatus请求参数
                var jsonpParams = {
                    areaid:1,
                    appid:10,
                    format:'jsonp'
                };

                if(isM){
                    jsonpParams.appid = 13;
                }

                //根据环境变量设置请求地址
                if(envType != '' && envType != 'pre'){
                    var checkStatusUrl = "https://oaptlogin.qidian.com/login/checkStatus?";
                }else{
                    var checkStatusUrl = "https://ptlogin.qidian.com/login/checkStatus?";
                }
                //拼接URL
                for(var n in jsonpParams){
                    checkStatusUrl = checkStatusUrl + n + '=' + jsonpParams[n] + '&';
                }

                //发送jsonp请求
                $.ajax({
                    type: "GET",
                    async: false,
                    url: checkStatusUrl,
                    dataType: "jsonp",
                    global:false,
                    jsonpCallback:'autoLoginHandler',
                    jsonp: "method",//传递给请求处理程序或页面的，用以获得jsonp回调函数名的参数名(一般默认为:callback)
                    success: function(json){
                      if(json.code == 0){
                          //当前域下种登录态相关cookie
                          Cookie.set('ywkey', json.data.ywKey, that.getRootDomain(), '/', 0);
                          Cookie.set('ywguid', json.data.ywGuid, that.getRootDomain(), '/', 0);

                          //手动改变defer对象的状态
                          if(checkLoginDefer){
                              checkLoginDefer && checkLoginDefer.resolve();
                          }else{
                              callbacks['autoSuccess'] && typeof callbacks['autoSuccess']  === 'function' && callbacks['autoSuccess']();
                          }
                      }else{
                          checkLoginDefer && checkLoginDefer.reject();
                      }
                    },
                    error:function(data){
                        //如果错误则不予处理
                        checkLoginDefer && checkLoginDefer.reject();
                    }
                });
            }else{
                //除此之外不做其他处理，防止与业务侧自己执行的登录成功后加载逻辑重复
                checkLoginDefer && checkLoginDefer.reject();
            }

            //超时逻辑，请求无回应时执行defer.reject()
            setTimeout(function(){
                checkLoginDefer && checkLoginDefer.reject();
            }, 5000);

            return checkLoginDefer && checkLoginDefer.promise();
        },

        /**
         * 获取当前根域
         * @method getRootDomain
         */
        getRootDomain: function(){
            var domain = document.domain.split('.');
            var length = domain.length;
            if (length >= 2) {
                return  '.' + domain[length - 2] + '.' + domain[length - 1];
            } else {
                return '.qidian.com';
            }
        },

        /**
         * 生成PC登录弹窗的url地址
         * @method getPCLoginUrl
         * @param customParams:其他端需要重置的参数【object】
         */
        getPCLoginUrl:function(customParams){
            if(envType != '' && envType != 'pre'){
                var baseUrl = 'https://oapassport.qidian.com/?';
            }else{
                var baseUrl = 'https://passport.qidian.com/?';
            }

            //默认参数【iframe形式】
            var params = {
                returnurl: customParams && customParams.returnurl || location.href,
                popup: 1,
                ticket: 1,
                target:'iframe',
                areaid:1,
                appid:10,
                auto:1,
                autotime:30,
                version:'1.0'
            };

            //是否为H5页面登录
            if(typeof customParams === 'object'){
                $.extend(params,customParams);
            }

            baseUrl += $.param(params);

            return baseUrl;
        },

        /**
         * 生成M站Login的url地址
         * @method getMLoginUrl
         * @param customParams:其他端需要重置的参数【object】
         */
        getMLoginUrl:function(customParams){
            if(envType != ''&& envType != 'pre'){
                var baseUrl = 'https://oapassport.qidian.com/?';
            }else{
                var baseUrl = 'https://passport.qidian.com/?';
            }

            //默认参数【iframe形式】
            var params = {
                popup: 0,
                ticket: 1,
                target:'top',
                areaid:1,
                appid:13,
                auto:1,
                autotime:30,
                version:'1.0',
                source:'m'
            };

            //是否为H5页面登录
            if(typeof customParams === 'object'){
                $.extend(params,customParams);
            }

            params.returnurl = params.returnurl || location.href;
            baseUrl += $.param(params);

            return baseUrl;
        },

        /**
         * 显示登录弹窗或跳转登录页面
         * @method showLogin
         * @param customParams:自定义参数【object】
         */
        showPCLogin:function(customParams){
            var body = $('body');
            var ifrUrl = this.getPCLoginUrl(customParams);

            //若为iframe形式的登录，则添加蒙板、append登录iframe
            var popop = [
                '<div class="qdlogin-wrap">',
                '<iframe id="loginIfr" src="'+ifrUrl+'" name="frameLG" id="frameLG" allowtransparentcy="true" width="100%" height="100%" scrolling="no" frameborder="no"></iframe>',
                '</div>'
            ].join('');

            //若已有蒙板，则移除，防止多次点击登录
            if($('.mask')){
                $('.mask').remove();
            }

            //若已有登录弹窗的容器元素，则移除，防止多次点击登录
            if($('.qdlogin-wrap')){
                $('.qdlogin-wrap').remove();
            }

            //将登录弹窗append到页面
            body.append('<div class="mask"></div>');
            body.append(popop);
        },

        /**
         * 跳转M站Login地址
         * @method showMLogin
         * @param customParams:自定义参数【object】
         */
        showMLogin:function(customParams){
            var body = $('body');
            var ifrUrl = this.getMLoginUrl(customParams);
            location.href = ifrUrl;
        },

        /**
         * 退出登录
         * @method goLogout
         */
        goLogout:function(){
            if(envType != ''&& envType != 'pre'){
                var finalUrl = '//oaptlogin.qidian.com/login/logout?';
            }else{
                var finalUrl = '//ptlogin.qidian.com/login/logout?';
            }

            var params = {
                appid:10,
                areaid:1,
                source:'pc',
                version:'1.0',
                format:'redirect'
            };
            //拼url
            for(var key in params){
                finalUrl += key + '='+ params[key] + '&';
            }
            var domscript = document.createElement("script");

            domscript.src = finalUrl;
            domscript.type = "text/javascript";
            domscript.id = 'sso' + Math.random();
            domscript.onloadDone = false;
            domscript.onload = function () {
                domscript.onloadDone = true;
                if(callbacks['logout'] && typeof callbacks['logout']  === 'function'){
                    callbacks['logout']();
                }
            };
            domscript.onreadystatechange = function () {
                if (('loaded' === domscript.readyState || 'complete' === domscript.readyState) && !domscript.onloadDone) {
                    if(callbacks['logout'] && typeof callbacks['logout'] === 'function'){
                        callbacks['logout']();
                    }
                    domscript.onloadDone = true;
                }
            };
            document.getElementsByTagName('head')[0].appendChild(domscript);
        },

        /**
         * 关闭登录弹窗-默认
         * @method _loginOnClose
         */
        _loginOnClose:function(){
            qdLogin.hideLoginIfr();
        },

        /**
         * 业务侧关闭弹窗执行逻辑
         * @method close
         */
        close:function(that, callback){
            if(callback && typeof callback == 'function') {
                callbacks['close'] = function(){
                    if(that){
                        callback.call(that);
                    }else{
                        callback();
                    }
                };
            }
        },

        /**
         * 登录成功-默认
         * @method _loginOnSuccess
         */
        _loginOnSuccess:function(){
            qdLogin.hideLoginIfr();
        },

        /**
         * 业务侧登录成功执行逻辑
         * @method success
         */
        success:function(that, callback){
            if(callback && typeof callback == 'function') {
                callbacks['success'] = function(){
                    if(that){
                        callback.call(that);
                    }else{
                        callback();
                    }
                };
                window.top.qdlogin_onSuccess = callbacks['success'];
            }
        },

        /**
         * 登录失败-默认
         * @method _loginOnError
         */
        _loginOnError:function(code, msg){
            alert(msg);
            //隐藏弹窗
            qdLogin.hideLoginIfr();

            //当code为10003时，表示账户被禁用但已登录，此时需退出登录
            if(code === 10003){
                qdLogin.goLogout();
            }
        },

        /**
         * 业务侧登录失败执行逻辑
         * @method error
         */
        error:function(that, callback){
            if(callback && typeof callback == 'function') {
                callbacks['error'] = function(){
                    if(that){
                        callback.call(that);
                    }else{
                        callback();
                    }
                };
                window.top.qdlogin_onError = callbacks['error'];
            }
        },

        /**
         * 业务侧退出登录执行逻辑
         * @method logout
         */
        logout:function(that, callback){
            if(callback && typeof callback == 'function'){
                callbacks['logout'] = function(){
                    if(that){
                        callback.call(that);
                    }else{
                        callback();
                    }
                };
            }
        },

        //自动登录成功
        autoSuccess:function(callback){
            if(callback && typeof callback == 'function'){
                callbacks['autoSuccess'] = function(){
                    callback();
                };
            }
        },

        /**
         * 隐藏弹窗及灰色蒙板
         * @method hideLoginIfr
         */
        hideLoginIfr:function(){
            var mask = $('.mask');
            var popup = $('.qdlogin-wrap');
            // 关闭弹窗与遮罩层
            popup.remove();
            mask.remove();
        },

        /**
         * 设置登录相关callback
         * @method setCallback
         */
        setCallback:function(name, that, callback){
            switch(name){
                case 'close':
                    qdLogin.close(that, callback);
                    break;
                case 'success':
                    qdLogin.success(that, callback);
                    break;
                case 'error':
                    qdLogin.error(that, callback);
                    break;
                case 'logout':
                    qdLogin.logout(that, callback);
                    break;
                case 'autoSuccess':
                    qdLogin.autoSuccess(callback);
                default:
                    break;
            }
        },

        _str2JSON: function (msg) {
            // borrow from jquery
            var rvalidchars = /^[\],:{}\s]*$/,
                rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
                rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
                rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g;

            if (rvalidchars.test(msg.replace(rvalidescape, "@")
                    .replace(rvalidtokens, "]")
                    .replace(rvalidbraces, "")) ) {
                return (new Function("return " + msg))();
            }
            return {};
        }
    };

    var Cookie = {
        /**
         * method get
         * @param name
         * @returns {null}
         */
        get: function(name){
            var carr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));

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
                document.cookie = tempcookie;
            }
        }
    };

    return qdLogin;
}));