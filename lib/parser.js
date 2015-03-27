'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),

	annotate               = require('./preprocessors/annotate'),
    filterReactCreateClass = require('./preprocessors/filterReactCreateClass'),
    filterModuleExports    = require('./preprocessors/filterModuleExports');


function parse(data) {
	var ast,
		preprocessors = [
			annotate,
			//filterReactCreateClass
		];

	ast = esprima.parse(data);

	_.forEach(preprocessors, function (preprocessor) {
		ast = preprocessor.process(ast);
	});

	return ast;
}


module.exports = {
    annotate: annotate.process,
    filterReactCreateClass: filterReactCreateClass.process,
    filterModuleExports: filterModuleExports.process,
    parse: parse
};
