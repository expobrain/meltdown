'use strict';

var _     = require('lodash'),
    debug = require('debug')('annotate'),
    utils = require('../utils');


function annotate(node) {
    _.assign(node, {
        getChildren: function () { return []; },
        compile: function (context) {
            debug(node.type, 'Default compile()')
            _.invoke(node.getChildren(), 'compile', context);
        }
    });

    switch (node.type) {

        case 'AssignmentExpression':
            _.assign(node, {
                getChildren: function () {
                    return [node.left, node.right];
                }
            });
            break;

        case 'BinaryExpression':
            _.assign(node, {
                getChildren: function () {
                    return [node.left, node.right];
                }
            });
            break;

        case 'BlockStatement':
            _.assign(node, {
                getChildren: function () {
                    return node.body.slice();
                }
            });
            break;

        case "CallExpression":
            _.assign(node, {
                compile: function (context) {
                    debug(node.type, 'Compile callee node...')
                    node.callee.compile(context);

                    if (context.render[0]) {
                        context.output += '(';
                    }

                    debug(node.type, 'Compile arguments node...')
                    _.invoke(node.arguments, 'compile', context);

                    if (context.render[0]) {
                        context.output += ')';
                    }

                    debug(node.type, '...done')
                },
                getChildren: function () {
                    return [node.callee].concat(node.arguments.slice());
                }
            });
            break;

        case 'ConditionalExpression':
            _.assign(node, {
                getChildren: function () {
                    return [node.test, node.consequent, node.alternate];
                }
            });
            break;

        case 'ExpressionStatement':
            _.assign(node, {
                getChildren: function () {
                    return [node.expression];
                }
            });
            break;

        case "FunctionExpression":
            _.assign(node, {
                getChildren: function () {
                    return [node.body];
                }
            });
            break;

        case "Identifier":
            _.assign(node, {
                compile: function (context) {
                    if (context.render[0]) {
                        context.output += node.name;
                    }
                }
            });
            break;

        case "Literal":
            _.assign(node, {
                compile: function (context) {
                    // var insideElement = _.find(context.path, {
                    //     type: "JSXElement"
                    // });

                    var render = context.render[0];

                    if (render && render === 'html' && node.raw) {
                        context.output += node.raw;
                    }
                },
                getChildren: function () {
                    return (node.value && node.value.type) ? [node.value] : [];
                }
            });
            break;

        case "MemberExpression":
            _.assign(node, {
                compile: function (context) {
                    var render = context.render[0];

                    node.object.compile(context);

                    if (render && (render !== 'django' || node.object.type !== 'ThisExpression')) {
                        context.output += '.';
                    }

                    node.property.compile(context);
                },
                getChildren: function () {
                    return [node.object, node.property];
                }
            });
            break;

        case "ObjectExpression":
            _.assign(node, {
                getChildren: function () {
                    return node.properties.slice();
                }
            });
            break;

        case "Program":
            _.assign(node, {
                getChildren: function () {
                    return node.body.slice();
                }
            });
            break;

        case "Property":
            _.assign(node, {
                getChildren: function () {
                    return [node.key, node.value];
                }
            });
            break;

        case "ReturnStatement":
            _.assign(node, {
                getChildren: function () {
                    return [node.argument];
                }
            });
            break;

        case "ThisExpression":
            _.assign(node, {
                compile: function (context) {
                    if (context.render[0] !== 'django') {
                        context.output += 'this';
                    }
                }
            });
            break;

        case "VariableDeclaration":
            _.assign(node, {
                getChildren: function () {
                    return node.declarations.slice();
                }
            });
            break;

        case "VariableDeclarator":
            _.assign(node, {
                getChildren: function () {
                    return [node.init];
                }
            });
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "ArrowFunctionExpression":
            _.assign(node, {
                getChildren: function () {
                    return node.body.slice();
                }
            });
            break;

        case "JSXAttribute":
            _.assign(node, {
                compile: function (context) {
                    if (context.render[0]) {
                        context.output += ' ' + node.name.name;

                        if (node.value) {
                            context.output += '=';
                        }
                    }
                },
                getChildren: function () {
                    return [node.name, node.value];
                }
            });
            break;

        case "JSXClosingElement":
            _.assign(node, {
                compile: function (context) {
                    if (context.render[0]) {
                        context.output += '</' + node.name.name + '>';
                    }
                }
            });
            break;

        case "JSXElement":
            _.assign(node, {
                compile: function (context) {
                    debug(node.type, 'Switching to "html" render...')
                    context.render.unshift('html');

                    debug(node.type, '..compiling openingElement node');
                    node.openingElement.compile(context);

                    if (context.render[0]) {
                        context.output += '>';
                    }

                    debug(node.type, '..compiling children node');
                    _.invoke(node.children, 'compile', context);

                    debug(node.type, '..compiling closingElement node');
                    node.closingElement.compile(context);

                    debug(node.type, '...Switching back to previous render')
                    context.render.shift();

                    debug(node.type, '...done');
                },
                getChildren: function () {
                    return [node.openingElement]
                        .concat(node.children)
                        .concat(node.closingElement);
                }
            });
            break;

        case "JSXExpressionContainer":
            _.assign(node, {
                compile: function (context) {
                    context.render.unshift('django');

                    if (context.render[0] === 'django') {
                        context.output += '{{';
                    }

                    node.expression.compile(context);

                    if (context.render[0] === 'django') {
                        context.output += '}}';
                    }

                    context.render.shift();
                },
                getChildren: function () {
                    return [node.expression];
                }
            });
            break;

        case "JSXOpeningElement":
            _.assign(node, {
                compile: function (context) {
                    if (context.render[0]) {
                        context.output += '<' + node.name.name;
                    }

                    _.invoke(node.attributes, 'compile', context);
                },
                getChildren: function () {
                    return node.attributes.slice();
                }
            });
            break;
    }

    return node;
}


module.exports.process = function (ast) {
    var nodes = [ast],
        node;

    utils.forEachNode(nodes, function (node) {
        annotate(node);
    });

    return ast;
};
