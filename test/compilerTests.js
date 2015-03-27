'use strict';

var should    = require('should'),
    debug     = require('debug')('test'),
    stringify = require('../lib/stringify'),
    parser    = require("../lib/parser"),
    compiler  = require("../lib/compiler");


describe('Compiler', function () {
    describe('#compile', function () {
        it('compile simple HTML', function () {
            var expected = '<div>Hello</div>';
            var ast = parser.parse(
                'var Hello = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello</div>;' +
                '  }' +
                '});' +
                'module.exports.Hello = Hello;'
            );

            compiler.compile(ast).should.equal(expected);
        });

        it('compile HTML with simple variables', function () {
            var expected = '<div>Hello {{props.name}}</div>';
            var ast = parser.parse(
                'var Hello = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello {this.props.name}</div>;' +
                '  }' +
                '});' +
                'module.exports.Hello = Hello;'
            );

            debug(stringify(ast));

            compiler.compile(ast).should.equal(expected);
        });

        it('skip compile simple HTML if not exported', function () {
            var expected = '';
            var ast = parser.parse(
                'var Hello = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello</div>;' +
                '  }' +
                '});'
            );

            compiler.compile(ast).should.equal(expected);
        });

        xit('compile simple template', function () {
            var expected = '<div></div>';
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
                '});'
            );

            compiler.compile(ast).should.equal(expected);
        });
    });
});
