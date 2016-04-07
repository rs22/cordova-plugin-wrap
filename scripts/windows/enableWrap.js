module.exports = function(ctx) {
    var fs                = ctx.requireCordovaModule('fs'),
        et                = ctx.requireCordovaModule('elementtree'),
        config            = ctx.requireCordovaModule('cordova-lib/src/cordova/config'),
        cordova           = ctx.requireCordovaModule('cordova-lib/src/cordova/cordova'),
        prepare           = ctx.requireCordovaModule('cordova-lib/src/cordova/prepare'),
        cordova_util      = ctx.requireCordovaModule('cordova-lib/src/cordova/util'),
        ConfigParser      = ctx.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');

    // I hoped I could override the 'content' XML element during 'prepare' using this hook
    // However this doesn't seem possible because the flow is as follows:
    // 1. Hook: before_prepare
    // 2. Copy 'content' element from global config to platform config
    // 3. Generate .appxmanifests based on platform content value
    // 4. Hook: after_prepare


    function findOrCreate(doc, name) {
        var ret = doc.find(name);
        if (!ret) {
            ret = new et.Element(name);
            doc.getroot().append(ret);
        }
        return ret;
    }

    // Maybe we can utilize preferences to store temp data during the build process, if needed
    /*
    function findPreferenceOrCreate(doc, name) {
        var prefs = doc.findall('preference');

        var ret = prefs.filter(function (elem) {
            return elem.attrib.name.toLowerCase() === name.toLowerCase();
        }).pop();

        if (!ret) {
            ret = new et.Element('preference');
            ret.attrib['name'] = name;
            doc.getroot().append(ret);
        }

        return ret;
    }
    */

    var platformRoot = ctx.opts.projectRoot + '/platforms/windows';


    var xml = cordova_util.projectConfig(platformRoot);
    var cfg = new ConfigParser(xml);
    var content = findOrCreate(cfg.doc, 'content');
    var actualContent = content.attrib['src'] || 'index.html';

    // This would be overridden:
    /*
    content.attrib['src'] = 'index_wrap.html';
    cfg.write();
    */

    var indexJsPath = platformRoot + '/www/js/index_wrap.js';
    var lastLineOfIndexJs = fs.readFileSync(indexJsPath, 'utf8').split('\n').pop();
    if (!lastLineOfIndexJs.startsWith('app.initialize')) {
        console.log('Enabling wrap...');
        fs.appendFileSync(indexJsPath, 'app.initialize(\'' + actualContent + '\');');
    }
}
