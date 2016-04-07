module.exports = {
    send: function (win, fail, args) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                win({
                    response: xhr.response,
                    responseText: xhr.responseText,
                    readyState: xhr.readyState,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseType: xhr.responseType,
                    responseHeaders: xhr.getAllResponseHeaders()
                });
            }
        };

        xhr.open(args.method, args.url);
        for (var header in args.headers) {
            xhr.setRequestHeader(header, args.headers[header]);
        }

        xhr.send(args.body);
    }
};

cordova.require('cordova/exec/proxy').add('XMLHttpRequest', module.exports);
