'use strict';

var _ = require('lodash'),
    debug = require('debug')('compiler'),
    parser = require('./parser'),
    utils = require('./utils');


module.exports.compile = function (ast) {
    var symbols,
        nodes,
        moduleExports;

    // Extract symbols
    nodes = ast.body.slice();
    symbols = {};

    utils.whileNodes(nodes, function (node) {
        switch (node.type) {
            case "VariableDeclaration":
                debug('Collecting declarations...');
                return node.declarations;
                break;

            case "VariableDeclarator":
                debug('...symbol', node.id.name, '->', node.init.type);
                symbols[node.id.name] = node.init;
                break;
        }
    });

    debug('Symbols:', _.keys(symbols));

    // Compile only nodes exported by module.exports
    moduleExports = parser.filterModuleExports(ast);

    debug('Exports:', moduleExports);

    // Compile exports
    return _.reduce(moduleExports, function (result, moduleExport) {
        var node = symbols[moduleExport.symbol],
            context = {
                render: [null],  // falsy, 'html', 'django'
                output: '',
                symbols: symbols
            };

        if (!node) {
            throw 'Symbol ' + moduleExport.symbol + ' not defined!';
        }

        node.compile(context);

        result[moduleExport.name] = context.output;

        return result;
    }, {})
};
