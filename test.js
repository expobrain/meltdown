var fs = require('fs');
var esprima = require('esprima-fb');
var _ = require('lodash');

var sample = fs.readFileSync('./tests/sample.jsx');
var ast = esprima.parse(sample);


function visitor(node, context) {

    // Skip if node is null
    if (!node) {
        return;
    }

    // Init context
    var nextNodes = [],
        nextContext;

    context = context ? _.cloneDeep(context) : {};
    context = _.defaults(context, {
        indent: 0,
        callee: ''
    });

    // Log current node
    console.log(_.repeat(' ', context.indent), node.type, context.callee);

    // Scan node
    switch (node.type) {
        // --------------------------------------------------------------------
        // Javascript
        // --------------------------------------------------------------------

        case "BlockStatement":
        case "Program":
            nextNodes = nextNodes.concat(node.body);
            break;

        case "VariableDeclaration":
            nextNodes = nextNodes.concat(node.declarations);
            break;

        case "VariableDeclarator":
            nextNodes.push(node.init);
            break;

        case "CallExpression":
            nextNodes = nextNodes.concat(node.arguments);
            context.callee = node.callee.type;
            break;

        case "ObjectExpression":
            nextNodes = nextNodes.concat(node.properties);
            break;

        case "ReturnStatement":
            nextNodes.push(node.argument);
            break;

        case "FunctionExpression":
            nextNodes.push(node.body);
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
                console.log(_.repeat(' ', context.indent), '- Skipping property', name);
                return;
            }

            context.callee = {type: node.type, name: name};
            nextNodes.push(node.value);
            break;

        case "Literal":
            if (node.value && node.value.type) {
                nextNodes.push(node.value);
            }
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXElement":
            nextNodes.push(node.openingElement);
            nextnodes = nextNodes.concat(node.children);
            nextNodes.push(node.closingElement);
            break;

        case "JSXOpeningElement":
            nextNodes = nextNodes.concat(node.attributes);
            break;

        case "JSXAttribute":
            nextNodes.push(node.name);
            nextNodes.push(node.value);
            break;

        case "JSXIdentifier":
        case "JSXClosingElement":
            break;

        // --------------------------------------------------------------------
        // Default
        // --------------------------------------------------------------------

        default:
            console.log('Unknonw node:\n', node);
            return;
    }

    // Process children
    context.indent += 2;

    _.forEach(nextNodes, function (nextNode) {
        visitor(nextNode, context);
    });
}


visitor(ast);
