var fs = require('fs');
var esprima = require('esprima-fb');
var _ = require('lodash');

var inputFile = fs.readFileSync('./samples/sample.jsx');
var outputFd = fs.openSync('./tests/sample.html', 'w');

var ast = esprima.parse(inputFile);

// Dump AST into JSON
// var stringify = require('./tests/stringify');
// var dumpFd = fs.openSync('./tests/ast.json', 'w');

// fs.writeSync(dumpFd, stringify(ast));
// fs.closeSync(dumpFd);

var context = {
    path: [],
    indent: 0,
    renderTo: 'React'
};


function writeNewline() {
    write('\n' + _.repeat(' ', context.indent));
}


function write(data) {
    fs.writeSync(outputFd, data);
}


function annotate(node) {
    switch (node.type) {
        case 'BlockStatement':
            node.writePreamble = function (context)  {
                if (context.renderTo === 'React') {
                    write('{');
                };
            }
            node.writeEpilogue = function (context)  {
                if (context.renderTo === 'React') {
                    write('}');
                };
            }
            node.writeNewline = function (context)  {
                if (context.renderTo === 'React') {
                    write(';');
                };
            }
            break;

        case "JSXAttribute":
            node.writeAttribute = function (context) {
                write(' ' + node.name.name);

                if (node.value) {
                    write('=');
                }
            };
            break;

        case "JSXExpressionContainer":
            node.writePreamble = function (context) {
                case (context.renderTo) {
                    case "React":
                        write('{{')
                }
                write("{% ");
                write(" %}");
            break;
    };
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
    annotate(node);

    // Scan node
    switch (node.type) {
        // --------------------------------------------------------------------
        // Javascript
        // --------------------------------------------------------------------

        case "BlockStatement":
            node.writePreamble(context);

            _.forEach(node.body, function (child) {
                visitor(child);
                node.writeNewline(context);
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
            write('this');
            break;

        case "CallExpression":
            visitor(node.callee);
            write('(')
            visitor(node.arguments);
            write(')');
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
            if (context.renderTo) {
                write(node.name);
            }
            break;

        case "ConditionalExpression":
            visitor(node.test);
            visitor(node.consequent);
            visitor(node.alternate);
            break;

        case "MemberExpression":
            visitor(node.object);
            write('.');
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
            // Write Literal only if inside JSXElement block
            if (_.includes(context.path, "JSXElement") && node.raw) {
                write(_.trim(node.raw));
            }

            if (node.value && node.value.type) {
                visitor(node.value);
            }
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXOpeningElement":
            write('<' + node.name.name);
            visitor(node.attributes);
            break;

        case "JSXElement":
            visitor(node.openingElement);
            write('>');

            context.indent += 4;
            writeNewline();
            visitor(node.children);
            context.indent -= 4;
            writeNewline();

            visitor(node.closingElement);
            break;

        case "JSXAttribute":
            node.writeAttribute();

            visitor(node.name);
            visitor(node.value);
            break;

        case "JSXIdentifier":
            break;

        case "JSXExpressionContainer":
            write("{% ");
            visitor(node.expression);
            write(" %}");
            break;

        case "JSXClosingElement":
            write('</' + node.name.name + '>');
            break;

        case "ArrowFunctionExpression":
            if (context.renderTo === 'React') {
                write('()=> ');
            }
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
