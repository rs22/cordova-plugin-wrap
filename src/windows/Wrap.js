var streamToUriResolver = null;

var Wrap = {

    registerCustomStreamToUriResolver: function(resolver) {
        streamToUriResolver = resolver;
    },

    getCustomStreamToUriResolver: function() {
        return streamToUriResolver;
    }
};

module.exports = Wrap;
