'use strict';

var _       = require('lodash'),
    esprima = require('esprima-fb'),
    should  = require('should'),

    parser = require("../lib/parser"),
    utils  = require('../lib/utils');


describe('Preprocess', function () {
    function parse(code) {
        return parser.annotate(esprima.parse(code));
    }

    describe('#filterReactClass', function () {
        it('includes React.class()', function () {
        });
    });

    describe('#filterReactClass', function () {
        it('includes React.class()', function () {
            // Pre-process AST
            var expected = parse('var myClass = React.createClass({});');
            var ast = parser.filterReactCreateClass(
                parse('var myClass = React.createClass({});')
            );

            // Check
            ast.should.eql(expected);
        });

        it('drops anything else except React.createClass()', function () {
            // Pre-process AST
            var ast = parser.filterReactCreateClass(
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
                parser.filterReactCreateClass({
                    type: 'BlockStatement',
                    body: []
                });
            }).should.throw();

            // Null root
            (function () {
                parser.filterReactCreateClass();
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
            });

            return ast;
        });
    });
});
