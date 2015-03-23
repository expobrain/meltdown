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

    switch (node.type) {
        case 'BlockStatement':
            node.writePreamble = function (context) {
                if (context.renderTo === 'React') {
                    write('{');
                }
            };
            node.writeEpilogue = function (context)  {
                if (context.renderTo === 'React') {
                    write('}');
                }
            };
            node.writeNewline = function (context) {
                if (context.renderTo === 'React') {
                    write(';');
                }
            };
            break;

        case "ThisExpression":
            node.write('this');
            break;

        case "CallExpression":
            node.writePreamble = function () {
                write('(');
            };
            node.writeEpilogue = function () {
                write(')');
            };
            break;

        case "Identifier":
            node.write = function() {
                write(node.name);
            };
            break;

        case "MemberExpression":
            node.write = function() {
                write('.');
            };
            break;

        case "Literal":
            node.write = function (context) {
                if (_.includes(context.path, "JSXElement") && node.raw) {
                    write(_.trim(node.raw));
                }
            };
            break;

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "JSXAttribute":
            node.write = function (context) {
                write(' ' + node.name.name);

                if (node.value) {
                    write('=');
                }
            };
            break;

        case "JSXExpressionContainer":
            node.writePreamble = function (context) {
                switch (context.renderTo) {
                    case "React":
                        write('{{');
                }
                write("{% ");
                write(" %}");
            };
            break;

        case "JSXOpeningElement":
            node.write = function () {
                write('<' + node.name.name);
            };
            break;

        case "JSXElement":
            node.write = function () {
                write('>');
            };
            break;

        case "JSXClosingElement":
            node.write = function () {
                write('</' + node.name.name + '>');
            };
            break;

        case "ArrowFunctionExpression":
            if (context.renderTo === 'React') {
                write('()=> ');
            }
            visitor(node.body);
            break;
    }
}


module.exports.annotate = annotate;
