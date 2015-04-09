'use strict';

var _      = require('lodash'),
    debug  = require('debug')('compiler'),
    glob   = require('glob'),
    path   = require('path'),
    mkdirp = require('mkdirp'),
    fs     = require('fs'),

    stringify = require('../lib/stringify'),
    parser    = require('./parser'),
    utils     = require('./utils');


function compileJSXExpressionContainer(node, context) {
    function isArrayMap(node) {
        return node.type === 'CallExpression' &&
            node.callee.type === 'MemberExpression' &&

            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'map' &&

            node.arguments.length === 1 &&
            node.arguments[0].type === 'FunctionExpression';
    }

    var functionNode;

    // Switch to Django rendering
    context.render.unshift('django');

    // Analyse expression
    if (isArrayMap(node.expression)) {
        // Is a loop!
        functionNode = node.expression.arguments[0];

        // Prologue
        context.output += '{% for ';
        context.output += _.pluck(functionNode.params, 'name').join(', ');
        context.output += ' in ';

        compileNode(node.expression.callee.object, context);

        context.output += ' %}';

        // Body
        context.render.unshift(null);
        compileNode(functionNode.body, context);
        context.render.shift();

        // Epilogue
        context.output += '{% endfor %}';
    } else {
        // Prologue
        context.output += '{{';

        // Body
        compileNode(node.expression, context);

        // Epilogue
        context.output += '}}';
    }

    // Switch back to previos rendering
    context.render.shift();
}


function compileNode(node, context) {
    var render;

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
            });

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
            render = context.render[0];

            if (render && render === 'html' && node.raw) {
                context.output += node.raw;
            }
            break;

        case "MemberExpression":
            render = context.render[0];

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
                    context.output += '="' + node.value.value + '"';
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
            });

            if (node.closingElement) {
                debug(node.type, '..compiling closingElement node');
                compileNode(node.closingElement, context);
            }

            debug(node.type, '...Switching back to previous render');
            context.render.shift();

            debug(node.type, '...done');
            break;

        case "JSXExpressionContainer":
            compileJSXExpressionContainer(node, context);
            break;

        case "JSXOpeningElement":
            if (context.render[0]) {
                context.output += '<' + node.name.name;
            }

            _.forEach(node.attributes, function (attr) {
                compileNode(attr, context);
            });

            if (node.selfClosing) {
                context.output += '/';
            }

            break;

        default:
            debug(node.type, 'Default compile()');
            _.forEach(utils.getNodeChildren(node), function (child) {
                compileNode(child, context);
            });
    }

    return context.output;
}


function compile(frame) {
    if (frame.exports) {
        return utils.minifyHtml(
            compileNode(frame.exports, {
                render: [null],  // falsy, 'html', 'django'
                output: '',
                symbols: frame.symbols
            })
        );
    } else {
        return '';
    }
}


function compileFile(source, dest) {
    var data,
        frame;

    console.log('Compiling', source, 'into', dest, '...');

    data = fs.readFileSync(source);
    frame = parser.parse(data, source);
    data = compile(frame);

    fs.writeFileSync(dest, data);
}


function compileDir(source, dest, options) {
    glob(path.join(source, '**/*.jsx'), function (err, files) {
        _.forEach(files, function (filename) {
            // Calculate output filename
            var outputDir,
                outputFile;

            // Calculate ouptut file and directory with .html extension
            outputDir = path.dirname(
                path.join(dest, path.relative(source, filename))
            );
            outputFile = path.basename(
                filename, path.extname(filename)
            ) + '.html';

            // Create dir if necessary
            mkdirp.sync(outputDir);

            // Compile file
            compileFile(filename, path.join(outputDir, outputFile));
        });
    });
}


module.exports = {
    compile: compile,
    compileFile: compileFile,
    compileDir: compileDir
};
