'use strict';

var _ = require('lodash');


function annotate(node) {
    node.children = function () { return []; };

    switch (node.type) {

        case 'AssignmentExpression':
            _.assing({
                children: function () {
                    return [node.left, node.right];
                }
            });
            break;

        case 'BinaryExpression':
            _.assing({
                children: function () {
                    return [node.left, node.right];
                }
            });
            break;

        case 'BlockStatement':
            _.assing({
                writePreamble: function (context) {
                    if (context.render[0] === 'react') {
                        context.output += '{';
                    }
                },
                writeEpilogue: function (context)  {
                    if (context.render[0] === 'react') {
                        context.output += '}';
                    }
                },
                children: function () {
                    return node.body.slice();
                }
            });
            break;

        case "CallExpression":
            _.assign(node, {
                writePreamble: function (context) {
                    if (context.render[0]) {
                        context.output += '(';
                    }
                },
                writeEpilogue: function (context) {
                    if (context.render[0]) {
                        context.output += ')';
                    }
                },
                children: function () {
                    return [node.callee].concat(node.arguments.slice());
                }
            });
            break;

        case 'ConditionalExpression':
            _.assing({
                children: function () {
                    return [node.test, node.consequent, node.alternate];
                }
            });
            break;

        case 'ExpressionStatement':
            _.assing({
                children: function () {
                    return [node.expression];
                }
            });
            break;

        case "FunctionExpression":
            _.assing(node, {
                children: function () {
                    return node.body.slice();
                }
            });
            break;

        case "Identifier":
            _.assing(node, {
                write: function (context) {
                    if (context.render[0]) {
                        context.output += node.name;
                    }
                }
            });
            break;

        case "Literal":
            _.assing(node, {
                write: function (context) {
                    var insideElement = _.find(context.path, {
                        type: "JSXElement"
                    });

                    if (context.render[0] && insideElement && node.raw) {
                        context.output += node.raw;
                    }
                },
                children: function () {
                    return (node.value && node.value.type) ? [node.value] : [];
                }
            });
            break;

        case "MemberExpression":
            _.assing(node, {
                write: function (context) {
                    var render = context.render[0];

                    if (render && (render !== 'django' || node.object.type !== 'ThisExpression')) {
                        context.output += '.';
                    }
                },
                children: function () {
                    return [node.object, node.property];
                }
            });
            break;

        case "ObjectExpression":
            _.assing(node, {
                children: function () {
                    return node.properties.slice();
                }
            });
            break;

        case "Program":
            _.assign(node, {
                children: function () {
                    return node.body.slice();
                }
            });
            break;

        case "Property":
            _.assing(node, {
                children: function () {
                    return [node.key, node.value];
                }
            });
            break;

        case "ReturnStatement":
            _.assing(node, {
                children: function () {
                    return [node.argument];
                }
            });
            break;

        case "ThisExpression":
            _.assign(node, {
                write: function (context) {
                    if (context.render[0] !== 'django') {
                        context.output += 'this';
                    }
                }
            });
            break;

        case "VariableDeclaration":
            _.assign(node, {
                children: function () {
                    return node.declarations.slice();
                }
            });
            break;

        case "VariableDeclarator":
            _.assign(node, {
                children: function () {
                    return [node.init];
                }
            });
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "ArrowFunctionExpression":
            _.assing(node, {
                children: function () {
                    return node.body.slice();
                }
            });
            break;

        case "JSXAttribute":
            _.assing(node, {
                write: function (context) {
                    if (context.render[0]) {
                        context.output += ' ' + node.name.name;

                        if (node.value) {
                            context.output += '=';
                        }
                    }
                },
                children: function () {
                    return [node.name, node.value];
                }
            });
            break;

        case "JSXClosingElement":
            _.assing(node, {
                write: function (context) {
                    if (context.render[0]) {
                        context.output += '</' + node.name.name + '>';
                    }
                }
            });
            break;

        case "JSXElement":
            _.assing(node, {
                write: function (context) {
                    if (context.render[0]) {
                        context.output += '>';
                    }
                },
                children: function () {
                    return [node.openingElement]
                        .concat(node.children)
                        .concat(node.closingElement);
                }
            });
            break;

        case "JSXExpressionContainer":
            _.assing(node, {
                writePreamble: function (context) {
                    if (context.render[0] === 'django') {
                        context.output += '{{';
                    }
                },
                writeEpilogue: function (context) {
                    if (context.render[0] === 'django') {
                        context.output += '}}';
                    }
                },
                children: function () {
                    return [node.expression];
                }
            });
            break;

        case "JSXOpeningElement":
            _.assing(node, {
                write: function (context) {
                    if (context.render[0]) {
                        context.output += '<' + node.name.name;
                    }
                },
                children: function () {
                    return node.attributes.slice();
                }
            });
            break;
    }
}


module.exports.process = function (ast) {
    var nodes = [ast],
        node;

    while (nodes.length) {
        node = nodes.pop();
        annotate(node);
        nodes.concat(node.children());
    }

    return ast;
};
