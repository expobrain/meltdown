'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    debug   = require('debug')('parser'),

	annotate            = require('./preprocessors/annotate'),
    filterModuleExports = require('./preprocessors/filterModuleExports'),
    filterSymbols       = require('./preprocessors/filterSymbols'),
    inlineComponents    = require('./preprocessors/inlineComponents');


function parse(data) {
    // Parse code and load symbols and exports
    var frame = {
            ast: esprima.parse(data),
            symbols: undefined,
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
