'use strict';

var _ = require('lodash'),
    debug = require('debug')('compiler'),
    parser = require('./parser'),
    utils = require('./utils');


module.exports.compile = function (frame) {
    // Compile exports
    return _.reduce(frame.exports, function (result, moduleExport) {
        var node = frame.symbols[moduleExport.symbol],
            context = {
                render: [null],  // falsy, 'html', 'django'
                output: '',
                symbols: frame.symbols
            };

        if (!node) {
            throw 'Symbol ' + moduleExport.symbol + ' not defined!';
        }

        debug('Compiling ' + moduleExport.name + '...');

        node.compile(context);

        result[moduleExport.name] = context.output;

        return result;
    }, {});
};
