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


function compileNode(node, context) {
    var render;

    if(!node){debugger}
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
};


function compileFile(source, dest) {
    var data,
        frame;

    console.log('Compiling', source, 'into', dest, '...');

    data = fs.readFileSync(source);
    frame = parser.parse(data, source);
    data = compile(frame);

    fs.writeFileSync(dest, data);
};


function compileDir(source, dest, options) {
    glob(path.join(source, '**/*.jsx'), function (err, files) {
        _.forEach(files, function (filename) {
            // Calculate output filename
            var output = path.join(dest, path.relative(source, filename));

            // Create dir if necessary
            mkdirp.sync(path.dirname(output));

            // Compile file
            compileFile(filename, output);
        })
    });
};


module.exports = {
    compile: compile,
    compileFile: compileFile,
    compileDir: compileDir
}
