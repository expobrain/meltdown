'use strict';

var _     = require('lodash'),
    debug = require('debug')('filterSymbols'),

    annotate = require('./annotate').process,
    utils    = require('../utils');


module.exports.process = function (ast) {
    var symbols = {},
        nodes;

    // Raise exception if root node is not Program
    if (!ast || ast.type !== 'Program') {
        throw "Root node is not <Program>";
    }

    nodes = ast.body.slice();

    utils.whileNodes(nodes, function (node) {
        switch (node.type) {
            case "VariableDeclaration":
                debug('Collecting declarations...');
                return node.declarations;

            case "VariableDeclarator":
                debug('...symbol', node.id.name, '->', node.init.type);
                symbols[node.id.name] = node.init;
                break;
        }
    });

    debug('Symbols:', _.keys(symbols));

    return symbols;
};
