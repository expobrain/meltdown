'use strict';

var _ = require('lodash'),
    debug = require('debug')('compiler'),
    parser = require('./parser'),
    utils = require('./utils');


module.exports.compile = function (frame) {
    // Compile exports
    return _.reduce(frame.exports, function (result, exportSymbol) {
        var node = frame.symbols[exportSymbol],
            context = {
                render: [null],  // falsy, 'html', 'django'
                output: '',
                symbols: frame.symbols
            };

        if (!node) {
            throw 'Symbol ' + exportSymbol + ' not defined!';
        }

        debug('Compiling ' + exportSymbol + '')

        node.compile(context);

        result[exportSymbol] = context.output;

        return result;
    }, {})
};
