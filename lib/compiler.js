'use strict';

var _      = require('lodash'),
    debug  = require('debug')('compiler'),
    glob   = require('glob'),
    path   = require('path'),
    mkdirp = require('mkdirp'),
    fs     = require('fs'),

    stringify = require('../lib/stringify'),
    parser    = require('./parser'),
    utils     = require('./utils'),

    constants = require('./constants');


function compileJSXElement(node, context) {
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
}


function compileJSXElementLink(node, context) {
    var attrs;

    // Switch to Django render
    context.render.unshift('django');

    // Extract attributes from component
    attrs = _.chain(node.openingElement.attributes)
        .reduce(function (result, attr) {
            result[attr.name.name] = attr;
            return result;
        }, {})
        .value();

    // Opening element and template tag
    context.output += '<a href="{% url ';
    context.output += "'" + attrs.to.value.value + "'";

    // Render Link's params
    if (attrs.params) {
        _.forEach(attrs.params.value.expression.properties, function (prop) {
            context.output += ' ';
            context.output += prop.key.name;
            context.output += '=';

            compileNode(prop.value, context);
        });
    }

    // Closing template tag
    context.output += ' %}"';

    // Render alt attribute
    if (attrs.alt && attrs.alt.value) {
        context.output += ' alt="';

        compileNode(attrs.alt.value, context);

        context.output += '"';
    }

    // Epilogue
    context.output += '></a>';

    // Reset render
    context.render.shift();
}


function compileJSXExpressionContainer(node, context) {
    function isArrayMap(node) {
        return node.type === 'CallExpression' &&
            node.callee.type === 'MemberExpression' &&

            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'map' &&

            node.arguments.length === 1 &&
            (node.arguments[0].type === 'FunctionExpression' ||
             node.arguments[0].type === 'ArrowFunctionExpression');
    }

    function isLodashMap(node) {
        return node.type === 'CallExpression' &&
            node.callee.type === 'MemberExpression' &&

            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === '_' &&

            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'map' &&

            node.arguments.length === 2 &&
            (node.arguments[1].type === 'FunctionExpression' ||
             node.arguments[1].type === 'ArrowFunctionExpression');
    }

    function compileArrayLoop(node, context) {
        var functionNode = node.expression.arguments[0],
            mapArgs =_.chain(functionNode.params).pluck('name').value();

        // Prologue
        context.output += '{% for ';
        context.output += mapArgs[0];
        context.output += ' in ';

        compileNode(node.expression.callee.object, context);

        context.output += ' %}';

        // Body
        context.render.unshift(null);
        compileNode(functionNode.body, context);
        context.render.shift();

        // Epilogue
        context.output += '{% endfor %}';
    }

    function compileLodashLoop(node, context) {
        var functionNode = node.expression.arguments[1],
            mapArgs =_.chain(functionNode.params).pluck('name').reverse().value();

        // Prologue
        context.output += '{% for ';
        context.output += mapArgs.join(', ');
        context.output += ' in ';

        compileNode(node.expression.arguments[0], context);

        context.output += '.items %}';

        // Body
        context.render.unshift(null);
        compileNode(functionNode.body, context);
        context.render.shift();

        // Epilogue
        context.output += '{% endfor %}';
    }

    function compileDefault(node, context) {
        // Prologue
        context.output += '{{';

        // Body
        compileNode(node.expression, context);

        // Epilogue
        context.output += '}}';
    }

    var compileFn = compileDefault;

    // Switch to Django rendering
    context.render.unshift('django');

    // Analyse expression and compile it
    if (isArrayMap(node.expression)) {
        compileFn = compileArrayLoop;
    } else if (isLodashMap(node.expression)) {
        compileFn = compileLodashLoop;
    }

    compileFn(node, context);

    // Switch back to previous rendering
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

            if (render && (render === 'html' || render === 'django') && node.raw) {
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
            var replace = context.options.replaceReactRouter,
                openingName = node.openingElement.name.name;

            if (replace && openingName === 'Link') {
                compileJSXElementLink(node, context);
            } else {
                compileJSXElement(node, context);
            }
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


function compile(frame, options) {
    if (frame.exports) {
        return utils.minifyHtml(
            compileNode(frame.exports, {
                render: [null],  // falsy, 'html', 'django'
                output: '',
                symbols: frame.symbols,
                options: options || {}
            })
        );
    } else {
        return '';
    }
}


function compileFile(source, dest, options) {
    var data,
        frame;

    console.log('Compiling', source, 'into', dest, '...');
    debug(source, dest, options);

    data = fs.readFileSync(source);
    frame = parser.parse(data, source, null, options);
    data = compile(frame, options);

    fs.writeFileSync(dest, data);
}


function compileDir(source, dest, options) {
    glob(path.join(source, '**/*.jsx'), function (err, files) {
        _.forEach(files, function (filename) {
            // Calculate output filename
            var outputDir,
                outputFile;

            // Calculate output file and directory with .html extension
            outputDir = path.dirname(
                path.join(dest, path.relative(source, filename))
            );

            outputFile = path.join(outputDir, path.basename(
                filename, path.extname(filename)
            ) + '.html');

            // Create dir if necessary
            mkdirp.sync(outputDir);

            // Compile file
            compileFile(filename, path.join(outputDir, outputFile), options);
        });
    });
}


module.exports = {
    compile: compile,
    compileFile: compileFile,
    compileDir: compileDir
};
