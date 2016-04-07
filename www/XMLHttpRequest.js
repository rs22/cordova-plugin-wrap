(function (win, doc) {

    if (typeof Windows !== 'undefined') {
        return;
    }

    if (win.XMLHttpRequest.__alreadyPatched !== undefined) {
        return;
    }

    var docDomain = null;
    try {
        docDomain = doc.domain;
    } catch (err) { }
    if (true) {
        var aliasXHR = win.XMLHttpRequest;
        var XHRShim = function () { };
        win.XMLHttpRequest = XHRShim;
        XHRShim.__alreadyPatched = true;
        XHRShim.noConflict = aliasXHR;
        XHRShim.UNSENT = 0;
        XHRShim.OPENED = 1;
        XHRShim.HEADERS_RECEIVED = 2;
        XHRShim.LOADING = 3;
        XHRShim.DONE = 4;
        XHRShim.incrementedCounter = 0;
        XHRShim.prototype = {
            isAsync: false,
            onreadystatechange: null,
            readyState: 0,
            _url: '',
            timeout: 0,
            withCredentials: false,
            _requestHeaders: {},
            open: function (reqType, uri, isAsync, user, password) {
                if (uri && uri.indexOf('http') !== 0) {
                    if (!this.wrappedXHR) {
                        this.wrappedXHR = new aliasXHR();
                        var self = this;
                        if (this.timeout > 0) {
                            this.wrappedXHR.timeout = this.timeout;
                        }
                        Object.defineProperty(this, 'timeout', {
                            set: function (val) {
                                this.wrappedXHR.timeout = val;
                            },
                            get: function () {
                                return this.wrappedXHR.timeout;
                            }
                        });
                        if (this.withCredentials) {
                            this.wrappedXHR.withCredentials = this.withCredentials;
                        }
                        Object.defineProperty(this, 'withCredentials', {
                            set: function (val) {
                                this.wrappedXHR.withCredentials = val;
                            },
                            get: function () {
                                return this.wrappedXHR.withCredentials;
                            }
                        });
                        Object.defineProperty(this, 'status', {
                            get: function () {
                                return this.wrappedXHR.status;
                            }
                        });
                        Object.defineProperty(this, 'responseText', {
                            get: function () {
                                return this.wrappedXHR.responseText;
                            }
                        });
                        Object.defineProperty(this, 'statusText', {
                            get: function () {
                                return this.wrappedXHR.statusText;
                            }
                        });
                        Object.defineProperty(this, 'responseXML', {
                            get: function () {
                                return this.wrappedXHR.responseXML;
                            }
                        });
                        Object.defineProperty(this, 'response', {
                            get: function () {
                                return this.wrappedXHR.response;
                            }
                        });
                        Object.defineProperty(this, 'responseType', {
                            set: function (val) {
                                return this.wrappedXHR.responseType = val;
                            }
                        });
                        this.getResponseHeader = function (header) {
                            return this.wrappedXHR.getResponseHeader(header);
                        };
                        this.getAllResponseHeaders = function () {
                            return this.wrappedXHR.getAllResponseHeaders();
                        };
                        this.wrappedXHR.onreadystatechange = function () {
                            self.changeReadyState(self.wrappedXHR.readyState);
                        };
                        if (this.wrappedXHR && this.wrappedXHR.upload) {
                            this.wrappedXHR.upload.onprogress = function (e) {
                                if (typeof self.upload.onprogress === 'function') {
                                    self.upload.onprogress(e);
                                }
                            };
                            this.wrappedXHR.upload.onload = function (e) {
                                if (typeof self.upload.onload === 'function') {
                                    self.upload.onload(e);
                                }
                            };
                            this.wrappedXHR.upload.onerror = function (e) {
                                if (typeof self.upload.onerror === 'function') {
                                    self.upload.onerror(e);
                                }
                            };
                            this.wrappedXHR.upload.onabort = function (e) {
                                if (typeof self.upload.onabort === 'function') {
                                    self.upload.onabort(e);
                                }
                            };
                        }
                    }
                    return this.wrappedXHR.open(reqType, uri, isAsync, user, password);
                }
                else {
                    this.isAsync = isAsync;
                    this.reqType = reqType;
                    this._url = uri;
                }
            },
            statusText: '',
            changeReadyState: function (newState) {
                this.readyState = newState;
                if (this.onreadystatechange) {
                    // mimic simple 'readystatechange' event which should be passed as per spec
                    var evt = { type: 'readystatechange', target: this, timeStamp: new Date().getTime() };
                    this.onreadystatechange(evt);
                }
                if (this.readyState == XHRShim.DONE) {
                    this.onload && this.onload();
                }
            },
            addEventListener: function (type, listener, useCapture) {
                if (this.wrappedXHR) {
                    this.wrappedXHR.addEventListener(type, listener, useCapture);
                } else {
                    this['on' + type] = listener;
                }
            },
            removeEventListener: function (type, listener, useCapture) {
                if (this.wrappedXHR) {
                    this.wrappedXHR.removeEventListener(type, listener, useCapture);
                } else {
                    if (this['on' + type] == listener) { // if listener is currently used
                        delete this['on' + type];
                    }
                }
            },
            setRequestHeader: function (header, value) {
                if (this.wrappedXHR) {
                    this.wrappedXHR.setRequestHeader(header, value);
                } else {
                    this._requestHeaders[header] = value;
                }
            },
            getResponseHeader: function (header) {
                if (this.wrappedXHR) {
                    return this.wrappedXHR.getResponseHeader(header);
                }

                var headerStrings = this._responseHeaders.split("\r\n");

                for (var i = 0; i < headerStrings.length; i++) {
                    var h = headerStrings[i];

                    if (!h)
                        continue;

                    var components = h.split(":");
                    if (components[0] === header)
                        return components.slice(1).join(":").trim();
                }

                return null;
            },
            getAllResponseHeaders: function () {
                return this.wrappedXHR ? this.wrappedXHR.getAllResponseHeaders() : this._responseHeaders;
            },
            overrideMimeType: function (mimetype) {
                return this.wrappedXHR ? this.wrappedXHR.overrideMimeType(mimetype) : '';
            },
            responseText: '',
            responseXML: '',
            onResult: function (res) {
                this.status = 200;
                if (typeof res == 'object') {
                    res = JSON.stringify(res);
                }
                this.responseText = res;
                this.responseXML = res;
                this.changeReadyState(XHRShim.DONE);
            },
            onError: function (err) {
                this.status = 404;
                this.changeReadyState(XHRShim.DONE);
            },
            abort: function () {
                if (this.wrappedXHR) {
                    return this.wrappedXHR.abort();
                }
            },
            send: function (data) {
                if (this.wrappedXHR) {
                    return this.wrappedXHR.send(data);
                }
                else {
                    this.changeReadyState(XHRShim.OPENED);
                    var alias = this;
                    var funk = function () {
                        alias.changeReadyState(XHRShim.LOADING);

                        var order = {
                            url: alias._url,
                            method: alias.reqType,
                            headers: alias._requestHeaders,
                            body: data
                        };

                        function onSuccess(result) {
                            if (result.status >= 200 && result.status <= 299) {
                                // Success
                                alias.response = result.response;
                                alias.responseText = result.responseText;
                                alias.readyState = result.readyState;
                                alias.status = result.status;
                                alias.statusText = result.statusText;
                                alias.responseType = result.responseType;
                                alias._responseHeaders = result.responseHeaders;

                                Object.defineProperty(alias, 'responseXML', {
                                    get: function () {
                                        return new DOMParser().parseFromString(result.responseText, 'text/xml');
                                    }
                                });

                                if (alias.onreadystatechange) {
                                    alias.onreadystatechange();
                                } else if (alias.onload) {
                                    alias.onload();
                                }
                            } else {
                                // Error
                                alias.readyState = 4; //READYSTATE_UNINITIALIZED
                                alias.status = result.status; // request timeout
                                alias.statusText = result.statusText;

                                if (alias.onreadystatechange) {
                                    alias.onreadystatechange();
                                } else if (alias.onerror) {
                                    alias.onerror();
                                }
                            }
                        };

                        cordova.exec(onSuccess, onError, "XMLHttpRequest", "send", order);
                    };
                    this.isAsync ? setTimeout(funk, 0) : funk();
                }
            },
            status: 404,
            upload: {
                addEventListener: function (type, listener, useCapture) {
                    if (this.wrappedXHR && this.wrappedXHR.upload) {
                        this.wrappedXHR.upload.addEventListener(type, listener, useCapture);
                    }
                }
            }
        };
    }
})(window, document);
