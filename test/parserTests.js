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
        return parser.collapseWhitespaces({
            ast: esprima.parse(code)
        });
    }

    //it('throw exception if AST root node is not Program', function () {
    //    var preprocessors = [
    //        parser.filterModuleExports,
    //        parser.filterSymbols,
    //        parser.inlineComponents
    //    ];
    //
    //    _.forEach(preprocessors, function (preprocessor) {
    //        // Not a Program
    //        (function () {
    //            parser.filterReactCreateClass({
    //                type: 'BlockStatement',
    //                body: []
    //            });
    //        }).should.throw();
    //
    //        // Null root
    //        (function () {
    //            parser.filterReactCreateClass();
    //        }).should.throw();
    //    });
    //});

    describe('#filterModuleExports', function () {
        it('by settings exports attribute', function () {
            var expected = ['MyClass'];
            var frame = parse(
                'var MyClass = React.createClass({});' +
                'module.exports = MyClass;'
            );

            parser.filterModuleExports(frame).exports.should.be.eql(expected);
        });
    });

    describe('#inlineComponents', function () {
        //it('simple inline without children', function () {
        //    var expected = parser.parse(
        //        'var Panel = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div></div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Component = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div></div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'module.exports = Component'
        //    );
        //    var frame = parser.parse(
        //        'var Panel = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div></div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Component = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <Panel></Panel>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'module.exports = Component'
        //    );
        //
        //    parser.inlineComponents(frame).ast.should.be.eql(expected.ast);
        //});
        //
        //it('simple inline with children', function () {
        //    var expected = parser.parse(
        //        'var Panel = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div>' +
        //        '        <p>{this.props.children}</p>' +
        //        '      </div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Component = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div>' +
        //        '        <p>Hello</p>' +
        //        '      </div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'module.exports = Component'
        //    );
        //    var frame = parser.parse(
        //        'var Panel = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div>' +
        //        '        <p>{this.props.children}</p>' +
        //        '      </div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Component = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <Panel>Hello</Panel>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'module.exports = Component'
        //    );
        //
        //    parser.inlineComponents(frame).ast.should.be.eql(expected.ast);
        //});

        it('multiple nested inlines with children', function () {
            var expected = parse(
                'var Content = React.createClass({' +
                '    render: function () {' +
                '        return (' +
                '            <div className="content">' +
                '               {this.props.children}' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                // 'var ResultList = React.createClass({' +
                // '    render: function () {' +
                // '        return (' +
                // '            <ol></ol>' +
                // '        );' +
                // '    }' +
                // '});' +
                // 'var Panel = React.createClass({' +
                // '    render: function () {' +
                // '        return (' +
                // '            <div className="panel">{this.props.children}</div>' +
                // '        );' +
                // '    }' +
                // '});' +
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
                '            <div className="content">' +
                '                <header></header>' +
                // '                <div className="panel">' +
                // '                    <ol></ol>' +
                // '                </div>' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                'module.exports = Page;'
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
                // 'var ResultList = React.createClass({' +
                // '    render: function () {' +
                // '        return (' +
                // '            <ol></ol>' +
                // '        );' +
                // '    }' +
                // '});' +
                // 'var Panel = React.createClass({' +
                // '    render: function () {' +
                // '        return (' +
                // '            <div className="panel">' +
                // '               {this.props.children}</div>' +
                // '        );' +
                // '    }' +
                // '});' +
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
                // '                <Panel>' +
                // '                    <ResultList/>' +
                // '                </Panel>' +
                '            </Content>' +
                '        );' +
                '    }' +
                '});' +
                'module.exports = Page;'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        //it('nested inline without children', function () {
        //    var expected = parser.parse(
        //        'var Parent = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div></div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Child = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <p></p>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Component = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div></div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'module.exports = Component'
        //    );
        //    var frame = parser.parse(
        //        'var Parent = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <div></div>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Child = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <p></p>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'var Component = React.createClass({' +
        //        '  render: function () {' +
        //        '    return (' +
        //        '      <Parent><Child></Child></Parent>' +
        //        '    );' +
        //        '  }' +
        //        '});' +
        //        'module.exports = Component'
        //    );
        //
        //    parser.inlineComponents(frame).ast.should.be.eql(expected.ast);
        //});
    });
});
