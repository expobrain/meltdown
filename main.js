'use strict';

var fs = require('fs');
var esprima = require('esprima-fb');
var _ = require('lodash');

var visitor = require('./lib/visitor');
var stringify = require('./lib/stringify');


module.exports = {
    transform: function (input, output) {
        var inputFile = fs.readFileSync(input);
        var outputFd = fs.openSync(output, 'w');

        var ast = esprima.parse(inputFile);
        var output = visitor.traverse(ast);
    },

    ast: function (inputFile, outputFile) {
        // Dump AST into JSON
        var data = fs.readFileSync(inputFile);
        var outputFd = fs.openSync(outputFile, 'w');

        var ast = esprima.parse(data);

        fs.writeSync(outputFd, stringify(ast));
    }
};
