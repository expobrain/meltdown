'use strict';

var _     = require('lodash'),
    debug = require('debug')('compiler'),

    stringify = require('../lib/stringify'),
    parser    = require('./parser'),
    utils     = require('./utils');


function compileNode(node, context) {
    switch (node.type) {

        case "CallExpression":
            debug(node.type, 'Compile callee node...');
            compileNode(node.callee, context);

            if (context.render[0]) {
                context.output += '(';
            }

            debug(node.type, 'Compile arguments node...');
            _.forEach(node.arguments, function (arg) {
                compileNode(arg, context);
            })

            if (context.render[0]) {
                context.output += ')';
            }

            debug(node.type, '...done');
            break;

        case "Identifier":
            if (context.render[0]) {
                context.output += node.name;
            }
            break;

        case "Literal":
            var render = context.render[0];

            if (render && render === 'html' && node.raw) {
                context.output += node.raw;
            }
            break;

        case "MemberExpression":
            var render = context.render[0];

            compileNode(node.object, context);

            if (render && (render !== 'django' || node.object.type !== 'ThisExpression')) {
                context.output += '.';
            }

            compileNode(node.property, context);
            break;

        case "ThisExpression":
            if (context.render[0] !== 'django') {
                context.output += 'this';
            }
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXAttribute":
            if (context.render[0]) {
                context.output += ' ' + node.name.name;

                if (node.value) {
                    context.output += '=';
                }
            }
            break;

        case "JSXClosingElement":
            if (context.render[0]) {
                context.output += '</' + node.name.name + '>';
            }
            break;

        case "JSXElement":
            debug(node.type, 'Switching to "html" render...');
            context.render.unshift('html');

            debug(node.type, '..compiling openingElement node');
            compileNode(node.openingElement, context);

            if (context.render[0]) {
                context.output += '>';
            }

            debug(node.type, '..compiling children node');
            _.forEach(node.children, function (child) {
                compileNode(child, context);
            })

            debug(node.type, '..compiling closingElement node');
            compileNode(node.closingElement, context);

            debug(node.type, '...Switching back to previous render');
            context.render.shift();

            debug(node.type, '...done');
            break;

        case "JSXExpressionContainer":
            context.render.unshift('django');

            if (context.render[0] === 'django') {
                context.output += '{{';
            }

            compileNode(node.expression, context);

            if (context.render[0] === 'django') {
                context.output += '}}';
            }

            context.render.shift();
            break;

        case "JSXOpeningElement":
            if (context.render[0]) {
                context.output += '<' + node.name.name;
            }

            _.forEach(node.attributes, function (attr) {
                compileNode(attr, context);
            });
            break;

        default:
            debug(node.type, 'Default compile()');
            _.forEach(utils.getNodeChildren(node), function (child) {
                compileNode(child, context);
            });
    }
}


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

        compileNode(node, context);

        result[exportSymbol] = context.output;

        return result;
    }, {})
};
