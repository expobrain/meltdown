'use strict';

var fs = require('fs');
var esprima = require('esprima-fb');
var _ = require('lodash');
var annotate = require('./lib/annotator').annotate;


module.exports = {
    transform: function (input, output) {
        var inputFile = fs.readFileSync(input);
        var outputFd = fs.openSync(output, 'w');

        var ast = esprima.parse(inputFile);

        // Dump AST into JSON
        var stringify = require('./tests/stringify');
        var dumpFd = fs.openSync(output + '.ast.json', 'w');

        fs.writeSync(dumpFd, stringify(ast));
        fs.closeSync(dumpFd);

        var context = {
            path: [],
            indent: 0,
            renderTo: 'React',
            outputFd: outputFd
        };

        function visitor(node) {
            // Skip if node is null
            if (!node) {
                return;
            } else if (_.isArray(node)) {
                _.forEach(node, function(n) {
                    visitor(n);
                });
                return;
            }

            // Log current node
            // console.log(_.repeat(' ', context.path.length * 2), node.valueOf());

            context.path.unshift(node.type);
            annotate(node, context);

            // Scan node
            switch (node.type) {
                // --------------------------------------------------------------------
                // Javascript
                // --------------------------------------------------------------------

                case "BlockStatement":
                    node.writePreamble(context);

                    _.forEach(node.body, function (child) {
                        visitor(child);
                    });

                    node.writeEpilogue(context);
                    break;

                case "Program":
                    visitor(node.body);
                    break;

                case "AssignmentExpression":
                    visitor(node.left);
                    visitor(node.right);
                    break;

                case "ExpressionStatement":
                    visitor(node.expression);
                    break;

                case "VariableDeclaration":
                    visitor(node.declarations);
                    break;

                case "VariableDeclarator":
                    visitor(node.init);
                    break;

                case "ThisExpression":
                    node.write(context);
                    break;

                case "CallExpression":
                    visitor(node.callee);
                    node.writePreamble(context);

                    visitor(node.arguments);
                    node.writeEpilogue(context);

                    break;

                case "ObjectExpression":
                    visitor(node.properties);
                    break;

                case "ReturnStatement":
                    visitor(node.argument);
                    break;

                case "FunctionExpression":
                    visitor(node.body);
                    break;

                case "BinaryExpression":
                    visitor(node.left);
                    visitor(node.right);
                    break;

                case "Identifier":
                    node.write(context);
                    break;

                case "ConditionalExpression":
                    visitor(node.test);
                    visitor(node.consequent);
                    visitor(node.alternate);
                    break;

                case "MemberExpression":
                    visitor(node.object);
                    node.write(context);
                    visitor(node.property);
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

                    if (name === 'render') {
                        visitor(node.value);
                    }

                    break;

                case "Literal":
                    node.write(context);

                    if (node.value && node.value.type) {
                        visitor(node.value);
                    }

                    break;

                // --------------------------------------------------------------------
                // JSX
                // --------------------------------------------------------------------

                case "JSXOpeningElement":
                    node.write(context);
                    visitor(node.attributes);
                    break;

                case "JSXElement":
                    visitor(node.openingElement);
                    node.write(context);
                    visitor(node.closingElement);
                    break;

                case "JSXAttribute":
                    node.write(context);

                    visitor(node.name);
                    visitor(node.value);
                    break;

                case "JSXIdentifier":
                    break;

                case "JSXExpressionContainer":
                    node.writePreamble(context);
                    visitor(node.expression);
                    node.writeEpilogue(context);
                    break;

                case "JSXClosingElement":
                    node.write(context);
                    break;

                case "ArrowFunctionExpression":
                    visitor(node.body);
                    break;

                // --------------------------------------------------------------------
                // Default
                // --------------------------------------------------------------------

                default:
                    console.log('Unknonw node:\n', node);
            }

            context.path.shift();
        }

        visitor(ast);
    }
};
