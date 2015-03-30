'use strict';

var _         = require('lodash'),
    esprima   = require('esprima-fb'),
    should    = require('should'),
    debug     = require('debug')('test'),
    stringify = require('../lib/stringify'),
    parser    = require("../lib/parser"),
    utils     = require('../lib/utils');


describe('Preprocess', function () {
    function parse(code) {
        return parser.annotate(esprima.parse(code));
    }

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
        it('annotates all the nodes with getChildren() method', function () {
            var ast = parse('var myClass = React.createClass({});'),
                node,
                nodes = [ast];

            utils.traverseTree(nodes, function (node) {
                _.isFunction(node.getChildren).should.be.true;
            });
        });

        it('annotates all the nodes with compile() method', function () {
            var ast = parse('var myClass = React.createClass({});'),
                node,
                nodes = [ast];

            utils.traverseTree(nodes, function (node) {
                _.isFunction(node.compile).should.be.true;
            });
        });
    });

    describe('#filterModuleExports', function () {
        it('by settings exports attribute', function () {
            var expected = [{
                name: 'myClass',
                symbol: 'MyClass'
            }];
            var ast = parse(
                'var MyClass = React.createClass({});' +
                'module.exports.myClass = MyClass;'
            );

            parser.filterModuleExports(ast).should.be.eql(expected);
        });
    });

    describe('#inlineComponents', function () {
        it('simple inline with empty children', function () {
            var expected = parser.parse(
                'var Panel = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});'+
                'module.exports.Component = Component;'
            );
            var ast = parser.parse(
                'var Panel = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <Panel></Panel>' +
                '    );' +
                '  }' +
                '});'+
                'module.exports.Component = Component;'
            );

            parser.inlineComponents(ast).should.be.eql(expected);
        });
    });
});
