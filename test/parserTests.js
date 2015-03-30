'use strict';

var _       = require('lodash'),
    esprima = require('esprima-fb'),
    should  = require('should'),
    debug   = require('debug')('test'),

    stringify = require('../lib/stringify'),
    parser    = require("../lib/parser"),
    utils     = require('../lib/utils');


describe('Preprocessors', function () {
    function parse(code) {
        return parser.annotate({
            ast: esprima.parse(code)
        });
    }

    it('throw exception if AST root node is not Program', function () {
        var preprocessors = [
            parser.filterModuleExports,
            parser.filterSymbols,
            parser.inlineComponents
        ];

        _.forEach(preprocessors, function (preprocessor) {
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
            var frame = parse('var myClass = React.createClass({});'),
                node,
                nodes = [frame.ast];

            utils.traverseTree(nodes, function (node) {
                _.isFunction(node.getChildren).should.be.true;
            });
        });

        it('annotates all the nodes with compile() method', function () {
            var frame = parse('var myClass = React.createClass({});'),
                node,
                nodes = [frame.ast];

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
            var frame = parse(
                'var MyClass = React.createClass({});' +
                'module.exports.myClass = MyClass;'
            );

            parser.filterModuleExports(frame).exports.should.be.eql(expected);
        });
    });

    describe('#inlineComponents', function () {
        it('simple inline without children', function () {
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
                '});' +
                'module.exports.Component = Component'
            );
            var frame = parser.parse(
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
                '});' +
                'module.exports.Component = Component'
            );

            parser.inlineComponents(frame).ast.should.be.eql(expected.ast);
        });

        it('nested inline without children', function () {
            var expected = parser.parse(
                'var Parent = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Child = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <p></p>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div><p></p></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports.Component = Component'
            );
            var frame = parser.parse(
                'var Parent = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Child = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <p></p>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <Parent><Child></Child></Parent>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports.Component = Component'
            );

            parser.inlineComponents(frame).ast.should.be.eql(expected.ast);
        });
    });
});
