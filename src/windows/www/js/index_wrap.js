var determineCordovaCallbackId = function (success, fail) {
    for (var callbackId in cordova.callbacks) {
        var callback = cordova.callbacks[callbackId];

        if (callback.success === success && callback.fail === fail) {
            return callbackId;
        }
    }

    return null;
};

var app = {
    initialize: function (content) {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        this.content = content || 'index.html';
    },

    onDeviceReady: function () {
        var webview = document.getElementById('webview');

        webview.addEventListener("MSWebViewNavigationStarting", function (e) {
            app.onLoadStart({url: e.uri});
        });

        webview.addEventListener("MSWebViewNavigationCompleted", function (e) {
            if (e.isSuccess) {
                app.onLoadStop({url: e.uri});
            } else {
                app.onLoadError({url: e.uri, code: e.webErrorStatus, message: "Navigation failed with error code " + e.webErrorStatus});
            }
        });

        webview.addEventListener("MSWebViewUnviewableContentIdentified", function (e) {
            // WebView found the content to be not HTML.
            // http://msdn.microsoft.com/en-us/library/windows/apps/dn609716.aspx
            app.onLoadError({url: e.uri, code: e.webErrorStatus, message: "Navigation failed with error code " + e.webErrorStatus});
        });

        webview.addEventListener("MSWebViewScriptNotify", function(e) {
            app.onNotify({ info: e });
        });

        var wrap = cordova.require('cordova-plugin-wrap.Wrap');
        var streamToUriResolver = wrap.getCustomStreamToUriResolver();
        if (streamToUriResolver) {
            var uri = webview.buildLocalStreamUri('custom', app.content);
            var resolver = streamToUriResolver;
            webview.navigateToLocalStreamUri(uri, resolver);
        } else {
            webview.src = 'ms-appx-web:///www/' + app.content;
        }

        app.webview = webview;
    },

    executeScript: function(script, callback) {
        if (!app.webview) {
            return;
        }

        setImmediate(function () {
            var op = app.webview.invokeScriptAsync("eval", script);
            op.oncomplete = function (e) {
                if (callback) {
                    // return null if event target is unavailable by some reason
                    var result = (e && e.target) ? [e.target.result] : [null];
                    callback(result);
                }
            };
            op.onerror = function () { };
            op.start();
        });
    },

    onLoadStart: function() {

    },

    onLoadStop: function() {
        app.executeScript("(function(){ cordova.require('cordova/channel').onNativeReady.fire()})();");
    },

    onLoadError: function() {

    },

    onNotify: function(info) {
        var value = info.info.value;

        var payload = JSON.parse(value);

        var service = payload.service,
            action = payload.action,
            callbackId = payload.callbackId,
            args = payload.args;

        // console.log('START ' + callbackId + ' ' + action + ' ' + JSON.stringify(args));

        var invokeCallbackFunc = function(callbackFunc, message, status, keepCallback, callback) {
            var messagePayload = message == null ? 'null' : JSON.stringify(message).replace('"', '\"');

            var args = {
                message: messagePayload,
                keepCallback: keepCallback,
                status: status
            };

            app.executeScript(callbackFunc + '(\'' + callbackId + '\', ' + JSON.stringify(args) + ');', callback);
        };

        var onSuccess = function (message) {
            // console.log('SUCCESS ' + callbackId + ' ' + JSON.stringify(message));
            var callbackFunc =
                '(function(callbackId,args) {' +
                    'try { args.message = JSON.parse(args.message); } catch (ex) { }' +
                    'cordova.callbackSuccess(callbackId,args);' +
                '})';

            // This is a hack to determine if the callback is being kept
            setImmediate(function () {
                var keepCallback = determineCordovaCallbackId(onSuccess, onError) !== null;
                invokeCallbackFunc(callbackFunc, message, cordova.callbackStatus.OK, keepCallback);
            });
        };

        var onError = function (message) {
            // console.log('FAIL ' + callbackId + ' ' + JSON.stringify(message));
            var callbackFunc =
                '(function(callbackId,args) {' +
                    'try { args.message = JSON.parse(args.message); } catch (ex) { }' +
                    'cordova.callbackError(callbackId,args);' +
                '})';

            // This is a hack to determine if the callback is being kept
            setImmediate(function () {
                var keepCallback = determineCordovaCallbackId(onSuccess, onError) !== null;
                invokeCallbackFunc(callbackFunc, message, cordova.callbackStatus.ERROR, keepCallback);
            });
        };

        cordova.exec(onSuccess, onError, service, action, args);
    }
};

// This will be added by the after_prepare hook:
// app.initialize('index.html');
