'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    debug   = require('debug')('parser'),

	annotate            = require('./preprocessors/annotate').process,
    filterModuleExports = require('./preprocessors/filterModuleExports').process,
    filterSymbols       = require('./preprocessors/filterSymbols').process,
    inlineComponents    = require('./preprocessors/inlineComponents').process;


function parse(data) {
    // Parse code and load symbols and exports
    var frame = {
            ast: esprima.parse(data),
            symbol: undefined,
            exports: undefined
        },
        preprocessors = [
            annotate,
            filterSymbols,
            filterModuleExports,
            inlineComponents
        ];

    _.forEach(preprocessors, function (preprocessor) {
        frame = preprocessor(frame);
    })

    // Return frame
    return frame;
}


module.exports = {
    annotate: annotate,
    filterModuleExports: filterModuleExports,
    filterSymbols: filterSymbols,
    inlineComponents: inlineComponents,
    parse: parse
};
