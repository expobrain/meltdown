'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    debug   = require('debug')('parser'),

    filterModuleExports = require('./preprocessors/filterModuleExports'),
    filterSymbols       = require('./preprocessors/filterSymbols'),
    inlineComponents    = require('./preprocessors/inlineComponents'),
    loadRequire         = require('./preprocessors/loadRequire');


function parse(data) {
    // Parse code and load symbols and exports
    var frame = {
            ast: esprima.parse(data),
            symbols: undefined,
            exports: undefined
        },
        preprocessors = [
            filterSymbols,
            filterModuleExports,
            inlineComponents
        ];

    // Load external files with require()
    frame = loadRequire(frame, parse);

    // ...continue with pre-processing
    _.forEach(preprocessors, function (preprocessor) {
        frame = preprocessor(frame);
    });

    // Return frame
    return frame;
}


module.exports = {
    filterModuleExports: filterModuleExports,
    filterSymbols: filterSymbols,
    inlineComponents: inlineComponents,
    parse: parse
};
