var assert = require("assert");
var esprima = require('esprima-fb');
var fs = require('fs');

var visitor = require("../lib/visitor");


describe('Visitor', function () {
    describe('#HelloMessage', function () {
        var inputFile = fs.readFileSync('./test/fixtures/HelloMessage.js');
        var ast = esprima.parse(inputFile);

        it('compare output', function () {
            var expected = '<div>{{props.name}}</div>';

            assert.equal(visitor.traverse(ast), expected);
        });
    });
});
