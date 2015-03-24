'use strict';

var _ = require('lodash');
var fs = require('fs');


function annotate(node, context) {

    function writeNewline() {
        write('\n' + _.repeat(' ', context.indent));
    }


    function write(data) {
        fs.writeSync(context.outputFd, data);
    }

    var render = context.renderStack[context.renderStack.length - 1];

    switch (node.type) {
        case 'BlockStatement':
            node.writePreamble = function (context) {
                if (render === 'react') {
                    write('{');
                }
            };
            node.writeEpilogue = function (context)  {
                if (render === 'react') {
                    write('}');
                }
            };
            node.writeNewline = function (context) {
                if (render === 'react') {
                    write(';');
                }
            };
            break;

        case "ThisExpression":
            node.write = function () {
                if (render) {
                    node.write('this');
                }
            };
            break;

        case "CallExpression":
            node.writePreamble = function () {
                if (render) {
                    write('(');
                }
            };
            node.writeEpilogue = function () {
                if (render) {
                    write(')');
                }
            };
            break;

        case "Identifier":
            node.write = function() {
                if (render) {
                    write(node.name);
                }
            };
            break;

        case "MemberExpression":
            node.write = function() {
                if (render) {
                    write('.');
                }
            };
            break;

        case "Literal":
            node.write = function (context) {
                if (render && _.includes(context.path, "JSXElement") && node.raw) {
                    write(_.trim(node.raw));
                }
            };
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXAttribute":
            node.write = function (context) {
                if (render) {
                    write(' ' + node.name.name);

                    if (node.value) {
                        write('=');
                    }
                }
            };
            break;

        case "JSXExpressionContainer":
            node.writePreamble = function (context) {
                if (render === 'react') {
                    write('{{');
                }
                write("{% ");
                write(" %}");
            };
            break;

        case "JSXOpeningElement":
            node.write = function () {
                if (render) {
                    write('<' + node.name.name);
                }
            };
            break;

        case "JSXElement":
            node.write = function () {
                if (render) {
                    write('>');
                }
            };
            break;

        case "JSXClosingElement":
            node.write = function () {
                if (render) {
                    write('</' + node.name.name + '>');
                }
            };
            break;
    }
}


module.exports.annotate = annotate;
