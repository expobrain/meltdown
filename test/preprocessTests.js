var _       = require('lodash');
    assert  = require("assert");
    esprima = require('esprima-fb');
    should  = require('should');

    preprocessor = require("../lib/preprocessor"),
    utils        = require('../lib/utils');


describe('Preprocess', function () {
    function parse(code) {
        return preprocessor.annotate(esprima.parse(code));
    }

    describe('#filterReactClass', function () {
        it('includes React.class()', function () {
            // Pre-process AST
            var expected = parse('var myClass = React.createClass({});');
            var ast = preprocessor.filterReactCreateClass(
                parse('var myClass = React.createClass({});')
            );

            // Check
            ast.should.eql(expected);
        });

        it('drops anything else except React.createClass()', function () {
            // Pre-process AST
            var ast = preprocessor.filterReactCreateClass(
                parse(
                    'React.render();' +
                    'var a = 42;' +
                    'React.render({});' +
                    'var myClass = React.createClass({});'
                )
            );
            var expected = parse('var myClass = React.createClass({});');

            // Check
            ast.should.eql(expected);
        });

        it('throw exception if AST root node is not Program', function () {
            // Not a Program
            (function () {
                preprocessor.filterReactCreateClass({
                    type: 'BlockStatement',
                    body: []
                });
            }).should.throw();

            // Null root
            (function () {
                preprocessor.filterReactCreateClass();
            }).should.throw();
        });
    });

    describe('#annotate', function () {
        it('annotates all the nodes with children() method', function () {
            var ast,
                node,
                nodes = [];


            ast = parse('var myClass = React.createClass({});');
            nodes = [ast];

            utils.forEachNode(nodes, function (node) {
                _.isFunction(node.children).should.be.true;
                node.children.should.be.Function;
            })

            return ast;
        });
    });
});
