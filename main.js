'use strict';

var fs = require('fs');
var esprima = require('esprima-fb');
var _ = require('lodash');

var visitor = require('./lib/visitor');


module.exports = {
    transform: function (input, output) {
        var inputFile = fs.readFileSync(input);
        var outputFd = fs.openSync(output, 'w');

        var ast = esprima.parse(inputFile);

        // Dump AST into JSON
        var stringify = require('./lib/stringify');
        var dumpFd = fs.openSync(output + '.ast.json', 'w');

        fs.writeSync(dumpFd, stringify(ast));
        fs.closeSync(dumpFd);

        visitor.traverse(ast, outputFd);
    }
};
