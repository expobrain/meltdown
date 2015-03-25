'use strict';

var _ = require('lodash');

var annotator = require('./annotator');


function compile(ast) {
    var context = {
        path: [],
        render: [null],  // falsy, 'html', 'python', 'django'
        output: ''
    };

    function visit(node) {
        // Skip if node is null
        if (!node) {
            return;
        } else if (_.isArray(node)) {
            _.forEach(node, function(n) {
                visit(n);
            });
            return;
        }

        // Log current node
        // console.log(node.valueOf());

        context.path.unshift(node);
        annotator.annotate(node, context);

        // Scan node
        switch (node.type) {
            // --------------------------------------------------------------------
            // Javascript
            // --------------------------------------------------------------------

            case "BlockStatement":
                node.writePreamble(context);

                _.forEach(node.body, function (child) {
                    visit(child);
                });

                node.writeEpilogue(context);
                break;

            case "Program":
                visit(node.body);
                break;

            case "AssignmentExpression":
                visit(node.left);
                visit(node.right);
                break;

            case "ExpressionStatement":
                visit(node.expression);
                break;

            case "VariableDeclaration":
                visit(node.declarations);
                break;

            case "VariableDeclarator":
                visit(node.init);
                break;

            case "ThisExpression":
                node.write(context);
                break;

            case "CallExpression":
                visit(node.callee);
                node.writePreamble(context);

                visit(node.arguments);
                node.writeEpilogue(context);

                break;

            case "ObjectExpression":
                visit(node.properties);
                break;

            case "ReturnStatement":
                visit(node.argument);
                break;

            case "FunctionExpression":
                visit(node.body);
                break;

            case "BinaryExpression":
                visit(node.left);
                visit(node.right);
                break;

            case "Identifier":
                node.write(context);
                break;

            case "ConditionalExpression":
                visit(node.test);
                visit(node.consequent);
                visit(node.alternate);
                break;

            case "MemberExpression":
                visit(node.object);
                node.write(context);
                visit(node.property);
                break;

            case "Property":
                var name;

                switch (node.key.type) {
                    case "Identifier":
                        name = node.key.name;
                        break;

                    case "Literal":
                        name = node.key.value;
                        break;

                    default:
                        console.log('Invalid key in', node);
                }

                // Visit only if a render() method
                if (name === 'render') {
                    visit(node.value);
                }

                break;

            case "Literal":
                node.write(context);

                if (node.value && node.value.type) {
                    visit(node.value);
                }

                break;

            // --------------------------------------------------------------------
            // JSX
            // --------------------------------------------------------------------

            case "JSXOpeningElement":
                node.write(context);
                visit(node.attributes);
                break;

            case "JSXElement":
                context.render.unshift('html');

                visit(node.openingElement);
                node.write(context);
                visit(node.children);
                visit(node.closingElement);

                context.render.shift();
                break;

            case "JSXAttribute":
                node.write(context);

                visit(node.name);
                visit(node.value);
                break;

            case "JSXIdentifier":
                break;

            case "JSXExpressionContainer":
                context.render.unshift('django');

                node.writePreamble(context);
                visit(node.expression);
                node.writeEpilogue(context);

                context.render.shift();
                break;

            case "JSXClosingElement":
                node.write(context);
                break;

            case "ArrowFunctionExpression":
                visit(node.body);
                break;

            // --------------------------------------------------------------------
            // Default
            // --------------------------------------------------------------------

            default:
                console.log('Unknonw node:\n', node);
        }

        context.path.shift();
    }

    visit(ast);

    return context.output;
}

module.exports.compile = compile;
