'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    debug   = require('debug')('parser'),

	annotate               = require('./preprocessors/annotate').process,
    filterReactCreateClass = require('./preprocessors/filterReactCreateClass').process,
    filterModuleExports    = require('./preprocessors/filterModuleExports').process,
    filterSymbols          = require('./preprocessors/filterSymbols').process;


function parse(data) {
    var ast = annotate(esprima.parse(data));

    return {
        symbols: filterSymbols(ast),
        exports: filterModuleExports(ast),
        ast: ast
    };
}


module.exports = {
    annotate: annotate,
    filterReactCreateClass: filterReactCreateClass,
    filterModuleExports: filterModuleExports,
    filterSymbols: filterSymbols,
    parse: parse
};
