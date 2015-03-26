'use strict';

var should = require('should'),

    parser   = require("../lib/parser"),
    compiler = require("../lib/compiler");


describe('Compiler', function () {
    describe('#compile', function () {
        it('translate simple HTML', function () {
            var expected = '<div>Hello</div>';
            var ast = parser.parse(
                'var HelloMessage = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello</div>;' +
                '  }' +
                '});'
            );

            compiler.compile(ast).should.equal(expected);
        });

        it('translate HTML with variables', function () {
            var expected = '<div>Hello {{props.name}}</div>';
            var ast = parser.parse(
                'var HelloMessage = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello {this.props.name}</div>;' +
                '  }' +
                '});'
            );

            //compiler.compile(ast).should.equal(expected);
        });
    });
});
