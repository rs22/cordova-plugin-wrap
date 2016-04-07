# Cordova Wrap Plugin

This is a plugin that enables the use of 'unsafe' JavaScript code in Cordova
apps for Windows.

The plugin adds an index_wrap.html file to the Windows platform project which holds
a WebView for the actual Cordova app content. It must be set as the startup file in
the App Manifests. The plugin also replaces the XMLHttpRequest object in the WebView
to allow cross-domain web requests.

The basic idea is that the index_wrap.html-file will load all available Cordova plugins.
The Cordova app code however will get a customized cordova.js which only loads the
platform-independent plugin code and forwards all `cordova.exec()` calls to
`window.external.notify`. The 'outer' Cordova runtime can now invoke the actual
plugin proxy JavaScript and feed the response back into the WebView. Ideally all
existing Cordova plugins for Windows will continue to work without modification.

**Set up a demo**

 1.  Clone this repository
 2.  `cd <repository path>`
 3.  `cordova create demo`
 4.  `cd demo`
 5.  `cordova platforms add windows`
 6.   Add a Cordova plugin that you'd like to try out, e.g.

     `cordova plugin add cordova-plugin-device`
 7.  `cordova plugin add ..\`
 8.  Use your plugin in the app, e.g. in www/js/index.js:

     ```js
     receivedEvent: function(id) {
         // There's some existing code here...
         // [...]

         receivedElement.textContent = 'Running on a ' + device.manufacturer + ' device ';
     }
     ```
 9.  The build task will run a hook that is defined in the Wrap plugin.

     `cordova build windows`
 10. Now you unfortunately have to fix your App Manifest manually in Visual Studio.
     For Windows 8.1 set the *Start Page* to www/index_wrap.html in the
     package.windows.appxmanifest.
 11. Start the App from Visual Studio and you should see the device plugin working.

**Some explanation**

This is a proof of concept and there might be a few things that are not working
as expected. The code is mostly based on the Cordova platform for Windows Phone
8 which also uses window.external.notify to communicate with native code.

 - **src/windows**
   - **www** - Will be copied to the Windows platform's www folder
     - **cordova.js** - This is an adoption of the cordova.js for Windows Phone 8.
       It replaces the default cordova.js
     - **cordova_wrap.js** - This is the original cordova.js for Windows
     - **index_wrap.html** - Hosts the web view and invokes index_wrap.js
     - **js/index_wrap.js** - This is the equivalent of [CordovaView.xaml.cs](https://github.com/apache/cordova-wp8/blob/master/template/cordovalib/CordovaView.xaml.cs) and there are still
     a few pieces missing
   - **Wrap.js** - Provides a method to register a custom `IUriToStreamResolver` to inject
     app sources into the WebView
   - **XMLHttpRequestProxy.js** - Acts as a proxy for making AJAX calls
 - **www/XMLHttpRequest.js** - Forwards AJAX requests inside the WebView to `cordova.exec()`.
   Based on [this](https://github.com/apache/cordova-wp8/blob/master/template/cordovalib/XHRHelper.cs)
   and [this](https://wat.codeplex.com/SourceControl/latest#windows-phone-8-development-project/site2AppWP8/XHR/injectedXHR.script).
 - **scripts/windows/enableWrap.js** - Will run during `cordova prepare`, tells index_wrap.js where to find the app's startup page
