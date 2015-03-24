'use strict';

var _ = require('lodash');


function annotate(node, context) {
    switch (node.type) {
        case 'BlockStatement':
            node.writePreamble = function (context) {
                if (context.render[0] === 'react') {
                    context.output += '{';
                }
            };
            node.writeEpilogue = function (context)  {
                if (context.render[0] === 'react') {
                    context.output += '}';
                }
            };
            break;

        case "ThisExpression":
            node.write = function (context) {
                if (context.render[0] !== 'django') {
                    context.output += 'this';
                }
            };
            break;

        case "CallExpression":
            node.writePreamble = function (context) {
                if (context.render[0]) {
                    context.output += '(';
                }
            };
            node.writeEpilogue = function (context) {
                if (context.render[0]) {
                    context.output += ')';
                }
            };
            break;

        case "Identifier":
            node.write = function (context) {
                if (context.render[0]) {
                    context.output += node.name;
                }
            };
            break;

        case "MemberExpression":
            node.write = function (context) {
                var render = context.render[0];

                if (render && (render !== 'django' || node.object.type !== 'ThisExpression')) {
                    context.output += '.';
                }
            };
            break;

        case "Literal":
            node.write = function (context) {
                if (context.render[0] && _.includes(context.path, "JSXElement") && node.raw) {
                    context.output += _.trim(node.raw);
                }
            };
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXAttribute":
            node.write = function (context) {
                if (context.render[0]) {
                    context.output += ' ' + node.name.name;

                    if (node.value) {
                        context.output += '=';
                    }
                }
            };
            break;

        case "JSXExpressionContainer":
            node.writePreamble = function (context) {
                if (context.render[0] === 'django') {
                    context.output += '{{';
                }
            };
            node.writeEpilogue = function (context) {
                if (context.render[0] === 'django') {
                    context.output += '}}';
                }
            };
            break;

        case "JSXOpeningElement":
            node.write = function (context) {
                if (context.render[0]) {
                    context.output += '<' + node.name.name;
                }
            };
            break;

        case "JSXElement":
            node.write = function (context) {
                if (context.render[0]) {
                    context.output += '>';
                }
            };
            break;

        case "JSXClosingElement":
            node.write = function (context) {
                if (context.render[0]) {
                    context.output += '</' + node.name.name + '>';
                }
            };
            break;
    }
}


module.exports.annotate = annotate;
