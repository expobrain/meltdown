'use strict';

var _     = require('lodash'),
    debug = require('debug')('filterSymbols'),

    utils = require('../utils');


module.exports = function (frame) {
    frame.symbols = {};

    utils.whileNodes(frame.ast, function (node) {
        switch (node.type) {
            case "Program":
                return node.body;

            case "VariableDeclaration":
                debug('Collecting declarations...');
                return node.declarations;

            case "VariableDeclarator":
                debug('...symbol', node.id.name, '->', node.init ? node.init.type : undefined);
                frame.symbols[node.id.name] = node.init;
                return;
        }
    });

    debug('Symbols:', _.keys(frame.symbols));

    return frame;
};
