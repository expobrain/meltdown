'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    debug   = require('debug')('parser'),

	annotate               = require('./preprocessors/annotate').process,
    filterReactCreateClass = require('./preprocessors/filterReactCreateClass').process,
    filterModuleExports    = require('./preprocessors/filterModuleExports').process,
    filterSymbols          = require('./preprocessors/filterSymbols').process,
    inlineComponents       = require('./preprocessors/inlineComponents').process;


function parse(data) {
    var ast = annotate(esprima.parse(data)),
        symbols = filterSymbols(ast),
        exports = filterModuleExports(ast);

    return {
        symbols: symbols,
        exports: exports,
        ast: ast
    };
}


module.exports = {
    annotate: annotate,
    filterReactCreateClass: filterReactCreateClass,
    filterModuleExports: filterModuleExports,
    filterSymbols: filterSymbols,
    inlineComponents: inlineComponents,
    parse: parse
};
