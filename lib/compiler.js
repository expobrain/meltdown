'use strict';

var _ = require('lodash'),
    debug = require('debug')('compiler'),
    utils = require('./utils');


module.exports.compile = function (ast) {
    var context = {
        render: [null],  // falsy, 'html', 'django'
        symbols: {},
        output: ''
    };

    // Extract symbols
    var nodes = ast.body.slice();

    utils.whileNodes(nodes, function (node) {
        switch (node.type) {
            case "VariableDeclaration":
                debug('Collecting declarations...');
                return node.declarations;
                break;

            case "VariableDeclarator":
                debug('...symbol', node.id.name, '->', node.init.type);
                context.symbols[node.id.name] = node.init;
                break;
        }
    });

    debug('Symbols:', _.keys(context.symbols));

    // Compile only nodes exported by module.exports

    // Compile code
    ast.compile(context);

    return context.output;
};
