var _       = require('lodash');
    assert  = require("assert");
    esprima = require('esprima-fb');
    should  = require('should');

    preprocessor = require("../lib/preprocessor");


describe('Preprocess', function () {
    function parse(code) {
        return preprocessor.annotate(esprima.parse(code));
    }

    describe('#filterReactClass', function () {
        it('includes React.class()', function () {
            // Pre-process AST
            var expected = parse('var myClass = React.createClass({});');
            var ast = preprocessor.filterReactCreateClass(expected);

            // Check
            ast.should.eql(expected);
        });

        it('drops anything else except React.createClass()', function () {
            // Pre-process AST
            var ast = preprocessor.filterReactCreateClass(
                parse(
                    'React.render();' +
                    'var a = 42;' +
                    'var myClass = React.createClass({});'
                )
            );
            var expected = parse('var myClass = React.createClass({});');

            // Check
            ast.should.eql(expected);
        });
    });

    describe('#annotate', function () {
        it('annotates all the nodes with children() method', function () {
            var ast,
                node,
                nodes = [];

            ast = parse('var myClass = React.createClass({});');
            nodes = [ast];

            while (nodes.length) {
                node = nodes.pop();

                _.isFunction(node.children).should.be.true;
                node.children.should.be.Function;

                nodes.concat(node.children());
            }

            return ast;
        });
    });
});
