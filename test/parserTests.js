'use strict';

var _       = require('lodash'),
    esprima = require('esprima-fb'),
    should  = require('should'),
    debug   = require('debug')('test'),

    stringify = require('../lib/stringify'),
    parser    = require("../lib/parser"),
    utils     = require('../lib/utils');


describe('Preprocessors', function () {
    function trimLiterals(frame) {
        utils.traverseTree(frame.ast, function (node) {
            if (node.type === "JSXElement") {
                node.children = _.chain(node.children)
                    .reduce(function (results, child) {
                        if (child.type !== 'Literal' || !child.value.match(/^\s+/)) {
                            results.push(child);
                        }
                        return results;
                    }, [])
                    .map(function (child) {
                        if (child.type === 'Literal') {
                            child.value = child.value.trim();
                            child.raw = child.raw.trim();
                        }
                        return child;
                    })
                    .value();
            }
        });

        return frame;
    }

    function parse(code) {
        return trimLiterals({
            ast: esprima.parse(code)
        });
    }

    describe('#basic', function () {
        it('throw exception if AST root node is not Program', function () {
            var preprocessors = [parser.filterModuleExports];

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

        it('supports arrow functions', function () {
            var source = (
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div onClick={ (event)=> { return; }}></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            var expected = parse(source);
            var frame = parser.parse(source);

            frame.ast.should.be.eql(expected.ast);
        });

        it('element attribute without value', function () {
            var source = (
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div no-attr-value></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            var expected = parse(source);
            var frame = parser.parse(source);

            frame.ast.should.be.eql(expected.ast);
        });
    });

    describe('#filterModuleExports', function () {
        it('by settings exports attribute', function () {
            var expected = parse('React.createClass({});').ast.body[0].expression;
            var frame = parser.filterSymbols(parse(
                'var MyClass = React.createClass({});' +
                'module.exports = MyClass;'
            ));

            parser.filterModuleExports(frame).exports.should.be.eql(expected);
        });
    });

    describe('#inlineComponents', function () {
        it('simple inline without children', function () {
            var expected = parse(
                'var Panel = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
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
                'module.exports = Component'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('simple inline with arguments', function () {
            var expected = parse(
                'var Panel = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div>{this.props.data}</div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div>{this.props.name}</div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );
            var frame = parser.parse(
                'var Panel = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div>{this.props.data}</div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <Panel data={this.props.name}></Panel>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('simple inline with children', function () {
            var expected = parse(
                'var Panel = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div>' +
                '        <p>{this.props.children}</p>' +
                '      </div>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div>' +
                '        <p>Hello</p>' +
                '      </div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );
            var frame = trimLiterals(parser.parse(
                'var Panel = React.createClass({' +
                '  render: function () {' +
                '    return (' +
                '      <div>' +
                '        <p>{this.props.children}</p>' +
                '      </div>' +
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
            ));

            frame.ast.should.be.eql(expected.ast);
        });

        it('multiple nested inlines with children', function () {
            var expected = parse(
                'var Content = React.createClass({' +
                '    render: () => {' +
                '        return (' +
                '            <div class="content">' +
                '               {this.props.children}' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                'var ResultList = React.createClass({' +
                '    render: () => {' +
                '        return (' +
                '            <ol></ol>' +
                '        );' +
                '    }' +
                '});' +
                'var Panel = React.createClass({' +
                '    render: () => {' +
                '        return (' +
                '            <div class="panel">' +
                '                {this.props.children}' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                'var Header = React.createClass({' +
                '    render: () => {' +
                '        return (' +
                '            <header></header>' +
                '        );' +
                '    }' +
                '});' +
                'var Page = React.createClass({' +
                '    render: () => {' +
                '        return (' +
                '            <div class="content">' +
                '                <header></header>' +
                '                <div class="panel">' +
                '                    <ol></ol>' +
                '                </div>' +
                '            </div>' +
                '        );' +
                '    }' +
                '});' +
                'module.exports = Page;'
            );
            var frame = trimLiterals(parser.parse(
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
            ));

            frame.ast.should.be.eql(expected.ast);
        });

        it('nested inline without children', function () {
            var expected = parse(
                'var Parent = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'var Child = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <p></p>' +
                '    );' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
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
                'module.exports = Component'
            );

            frame.ast.should.be.eql(expected.ast);
        });
    });

    describe('#anonymousFunctions', function () {
        it("convert Anonymous Function into Arrow Function", function () {
            var expected = parse(
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <ul>' +
                '        {this.props.results.map((result) => {' +
                '           return <li></li>;' +
                '        })}' +
                '      </ul>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );
            var frame = trimLiterals(parser.parse(
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <ul>' +
                '        {this.props.results.map(function (result) {' +
                '           return <li></li>;' +
                '        })}' +
                '      </ul>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            ));

            frame.ast.should.be.eql(expected.ast);
        });
    });

    describe('#className', function () {
        it("convert className attribute into class", function () {
            var expected = parse(
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div class="my-class"></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );
            var frame = trimLiterals(parser.parse(
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <div className="my-class"></div>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            ));

            frame.ast.should.be.eql(expected.ast);
        });
    });

    describe('#forLoops', function () {
        it('generate simple for loop', function () {
            var expected = parse(
                'var ListItem = React.createClass({' +
                '  render: () => {' +
                '    return <li>{this.props.data.text}</li>;' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: () => {' +
                '    return (' +
                '      <ul>' +
                '        {this.props.results.map((result) => {' +
                '           return <li>{result.text}</li>' +
                '        })}' +
                '      </ul>' +
                '    );' +
                '  }' +
                '});' +
                'module.exports = Component'
            );
            var frame = trimLiterals(parser.parse(
                'var ListItem = React.createClass({' +
                '  render: () => {' +
                '    return <li>{this.props.data.text}</li>;' +
                '  }' +
                '});' +
                'var Component = React.createClass({' +
                '  render: () => {' +
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
            ));

            frame.ast.should.be.eql(expected.ast);
        });
    });

    describe('#require', function () {
        it('loads code from external file', function () {
            var expected = parser.parse('var a = 42;');
            var frame = parser.parse(
                'var a = require("./test/fixtures/require_base.test");'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('loads code from external file: implicit .js extension', function () {
            var expected = parser.parse('var a = 42;');
            var frame = parser.parse(
                'var a = require("./test/fixtures/require_base_js.test");'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('loads code from external file: implicit .jsx extension', function () {
            var expected = parser.parse('var a = 42;');
            var frame = parser.parse(
                'var a = require("./test/fixtures/require_base_jsx.test");'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('loads code with Node.js dependencies', function () {
            var expected = parser.parse('var a = 42;');
            var frame = parser.parse(
                'var a = require("./test/fixtures/require_node.test");'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('loads nested requires', function () {
            var expected = parser.parse('var a = 42;');
            var frame = parser.parse(
                'var a = require("./test/fixtures/require_nested.test");'
            );

            frame.ast.should.be.eql(expected.ast);
        });

        it('throw exception if export is not a symbol', function () {
            var data = (
                'var a = require("./test/fixtures/require_nosymbol.test");'
            );

            (function () {
                parser.parse(data);
            }).should.throw(
                'File ./test/fixtures/require_nosymbol.test module.exports is undefined'
            );
        });
    });
});
