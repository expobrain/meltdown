var assert = require("assert");
var esprima = require('esprima-fb');
var should = require('should');

var preprocessor = require("../lib/preprocessor");


describe('Preprocess', function () {
    describe('#filterReactClass', function () {
        it('includes React.class()', function () {
            // Pre-process AST
            var expected = esprima.parse(
                'var myClass = React.createClass({});'
            );
            var ast = preprocessor.filterReactCreateClass(expected);

            // Check
            ast.should.eql(expected);
        });

        it('drops anything else except react.createClass()', function () {
            // Pre-process AST
            var ast = preprocessor.filterReactCreateClass(
                esprima.parse(
                    'var a = 42;' +
                    'var myClass = React.createClass({});'
                )
            );
            var expected = esprima.parse(
                'var myClass = React.createClass({});'
            );

            // Check
            ast.should.eql(expected);
        });
    });
});
