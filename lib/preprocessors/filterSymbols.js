'use strict';

var _     = require('lodash'),
    debug = require('debug')('filterSymbols'),

    annotate = require('./annotate').process,
    utils    = require('../utils');


module.exports = function (frame) {
    var nodes;

    // Raise exception if root node is not Program
    if (!frame.ast || frame.ast.type !== 'Program') {
        throw "Root node is not <Program>";
    }

    frame.symbols = {};
    nodes = frame.ast.body.slice();

    utils.whileNodes(nodes, function (node) {
        switch (node.type) {
            case "VariableDeclaration":
                debug('Collecting declarations...');
                return node.declarations;

            case "VariableDeclarator":
                debug('...symbol', node.id.name, '->', node.init.type);
                frame.symbols[node.id.name] = node.init;
                break;
        }
    });

    debug('Symbols:', _.keys(frame.symbols));

    return frame;
};
