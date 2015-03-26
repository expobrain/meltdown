'use strict';

var _ = require('lodash'),
    utils = require('./utils');


module.exports.compile = function (ast) {
    var context = {
        render: [null],  // falsy, 'html', 'django'
        path: [],
        output: ''
    };

    ast.compile(context);

    return context.output;
};
