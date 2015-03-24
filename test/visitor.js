var assert = require("assert");
var esprima = require('esprima-fb');

var visitor = require("../lib/visitor");


describe('Visitor', function () {
    describe('#traverse', function () {
        it('translate simple HTML', function () {
            var expected = '<div>Hello</div>';
            var ast = esprima.parse(
                'var HelloMessage = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello</div>;' +
                '  }' +
                '});'
            );

            assert.equal(visitor.traverse(ast), expected);
        });

        it('translate HTML with variables', function () {
            var expected = '<div>Hello {{props.name}}</div>';
            var ast = esprima.parse(
                'var HelloMessage = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello {this.props.name}</div>;' +
                '  }' +
                '});'
            );

            assert.equal(visitor.traverse(ast), expected);
        });
    });
});
