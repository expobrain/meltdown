'use strict';

var should  = require('should'),
    debug   = require('debug')('test'),

    stringify = require('../lib/stringify'),
    parser    = require("../lib/parser"),
    compiler  = require("../lib/compiler"),
    utils     = require("../lib/utils");


describe('Compiler', function () {
    describe('#basics', function () {
        it('compile simple HTML', function () {
            var expected = '<div>Hello</div>';
            var frame = parser.parse(
                'var Hello = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello</div>;' +
                '  }' +
                '});' +
                'module.exports = Hello;'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('compile HTML with simple variables', function () {
            var expected = '<div>Hello {{props.name}}</div>';
            var frame = parser.parse(
                'var Hello = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello {this.props.name}</div>;' +
                '  }' +
                '});' +
                'module.exports = Hello;'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('skip compile simple HTML if not exported', function () {
            var expected = '';
            var frame = parser.parse(
                'var Hello = React.createClass({' +
                '  render: function() {' +
                '    return <div>Hello</div>;' +
                '  }' +
                '});'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('compile self-closing element', function () {
            var expected = '<input' + '>';
            var frame = parser.parse(
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <input />' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            compiler.compile(frame).should.eql(expected);
        });
    });

    describe('#inline', function () {
        it('compile simple template', function () {
            var expected = '<div></div>';
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
                '});'+
                'module.exports = Component;'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('compile nested components without children', function () {
            var expected = '<div></div>';
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
                'module.exports = Component'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('compile nested components with children', function () {
            var expected = '<div><p>Hello</p></div>';
            var frame = parser.parse(
                'var Panel = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div><p>{this.props.children}</p></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <Panel>Hello</Panel>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('compile self-closing inline', function () {
            var expected = '<div></div>';
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
                '      <Panel/>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('compile multiple inline components with children', function() {
            var expected = utils.minifyHtml(
                '<div className="content">' +
                '    <header></header>' +
                '    <div className="panel">' +
                '        <ol></ol>' +
                '    </div>' +
                '</div>'
            );
            var frame = parser.parse(
                'var Content = React.createClass({' +
                '    render: function () {' +
                '        return (' +
                '            <div className="content">' +
                '               {this.props.children}' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                'var ResultList = React.createClass({' +
                '    render: function () {' +
                '        return (' +
                '            <ol></ol>' +
                '        );' +
                '    }' +
                '});' +
                'var Panel = React.createClass({' +
                '    render: function () {' +
                '        return (' +
                '            <div className="panel">' +
                '               {this.props.children}' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                'var Header = React.createClass({' +
                '    render: function () {' +
                '        return (' +
                '            <header></header>' +
                '        );' +
                '    }' +
                '});' +
                'var Page = React.createClass({' +
                '    render: function () {' +
                '        return (' +
                '            <Content>' +
                '                <Header/>' +
                '                <Panel>' +
                '                    <ResultList/>' +
                '                </Panel>' +
                '            </Content>' +
                '        );' +
                '    }' +
                '});' +
                'module.exports = Page;'
            );

            compiler.compile(frame).should.eql(expected);
        });
    });

    describe('#forLoops', function () {
        it('generate simple for loop', function () {
            var expected = utils.minifyHtml(
                '<ul>' +
                '{% for result in props.results %}' +
                '    <li>{{result.text}}</li>' +
                '{% endfor %}' +
                '</ul>'
            );
            var frame = parser.parse(
                'var ListItem = React.createClass({' +
                '  render: function() {' +
                '    return <li>{this.props.data.text}</li>;' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function() {' +
                '    return (' +
                '      <ul>' +
                '        {this.props.results.map(function(result) {' +
                '           return <ListItem key={result.id} data={result}/>;' +
                '        })}' +
                '      </ul>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            compiler.compile(frame).should.eql(expected);
        });

        it('loop with value and key', function () {
            var expected = utils.minifyHtml(
                '<ul>' +
                '{% for key, value in props.results %}' +
                '    <li>{{value.text}}</li>' +
                '{% endfor %}' +
                '</ul>'
            );
            var frame = parser.parse(
                'var ListItem = React.createClass({' +
                '  render: function() {' +
                '    return <li>{this.props.data.text}</li>;' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function() {' +
                '    return (' +
                '      <ul>' +
                '        {this.props.results.map(function(value, key) {' +
                '           return <ListItem key={value} data={value}/>;' +
                '        })}' +
                '      </ul>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            compiler.compile(frame).should.eql(expected);
        });
    });
});
