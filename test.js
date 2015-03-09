var fs = require('fs');
var esprima = require('esprima-fb');
var _ = require('lodash');

var inputFile = fs.readFileSync('./tests/sample.jsx');
var outputFd = fs.openSync('./tests/sample.html', 'w');
var ast = esprima.parse(inputFile);


function visitor(node, context) {

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
    console.log(node.type);

    // Scan node
    switch (node.type) {
        // --------------------------------------------------------------------
        // Javascript
        // --------------------------------------------------------------------

        case "BlockStatement":
        case "Program":
            visitor(node.body);
            break;

        case "VariableDeclaration":
            visitor(node.declarations);
            break;

        case "VariableDeclarator":
            visitor(node.init);
            break;

        case "CallExpression":
            visitor(node.arguments);
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
                    return;
            }

            if (name !== 'render') {
                return;
            }

            visitor(node.value);
            break;

        case "Literal":
            if (node.raw) {
                fs.writeSync(outputFd, node.raw);
            }

            if (node.value && node.value.type) {
                visitor(node.value);
            }
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXOpeningElement":
            fs.writeSync(outputFd, '<' + node.name.name);
            visitor(node.attributes);
            break;

        case "JSXElement":
            console.log(node);
            visitor(node.openingElement);
            fs.writeSync(outputFd, '>');
            visitor(node.children);
            visitor(node.closingElement);
            break;

        case "JSXAttribute":
            fs.writeSync(outputFd, ' ' + node.name.name);

            if (node.value) {
                fs.writeSync(outputFd, '=');
            }

            visitor(node.name);
            visitor(node.value);
            break;

        case "JSXIdentifier":
            break;

        case "JSXClosingElement":
            fs.writeSync(outputFd, '</' + node.name.name + '>');
            break;

        // --------------------------------------------------------------------
        // Default
        // --------------------------------------------------------------------

        default:
            console.log('Unknonw node:\n', node);
            return;
    }
}


visitor(ast);
