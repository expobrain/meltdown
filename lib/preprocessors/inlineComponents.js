'use strict';

var _         = require('lodash'),
    debug     = require('debug')('inlineComponents'),

    stringify = require('../stringify'),
    utils     = require('../utils');


function inlineChildren(component, parentNode) {
    var nodes;

    component = _.cloneDeep(component);
    nodes = component.children.slice();

    utils.traverseTree(nodes, function (node) {
        if (node.type === 'JSXElement') {
            _.forEach(node.children, function (child, index) {
                var isPropsChildren = child.type === 'JSXExpressionContainer' &&

                    child.expression.type === 'MemberExpression' &&
                    child.expression.object.type === 'MemberExpression' &&
                    child.expression.object.object.type === 'ThisExpression' &&

                    child.expression.object.property.type === 'Identifier' &&
                    child.expression.object.property.name === 'props' &&

                    child.expression.property.type === 'Identifier' &&
                    child.expression.property.name === 'children';

                if (isPropsChildren) {
                    // Replace JSXExpressionContainer with the component's children
                    node.children.splice.apply(
                        node.children,
                        [index, 1].concat(_.cloneDeep(parentNode.children))
                    );
                }
            });
        }
    });

    return component.children;
}


function inlineComponent(node, frame) {
    // Load component form symbols
    var componentName = node.openingElement.name.name,
        component = frame.symbols[componentName];

    // Extract AST from component to inline
    component = utils.findNode([component], function (node) {
        return node.type === 'JSXElement';
    });

    debug('Inlining ' + componentName + '...');

    // Inline component into current node
    node.openingElement.name.name = component.openingElement.name.name;
    node.closingElement.name.name = component.openingElement.name.name;

    node.children = inlineChildren(component, node);
}


function findInlines(node, frame) {
    utils.traverseTree([node], function (node) {
        // Check if needs inline
        var component,
            componentName,
            needInline = node.type === 'JSXElement' &&
                node.openingElement.type === 'JSXOpeningElement' &&
                node.openingElement.name.type === 'JSXIdentifier' &&
                _.has(frame.symbols, node.openingElement.name.name);

        if (needInline) {
            inlineComponent(node, frame);
        }
    });
}


module.exports.process = function (frame) {
    // Raise exception if root node is not Program
    if (!frame.ast || frame.ast.type !== 'Program') {
        throw "inlineComponents: Root node is not <Program>";
    }

    _.forEach(frame.exports, function (moduleExport) {
        var node = frame.symbols[moduleExport.symbol];

        findInlines(node, frame);
    });

    return frame;
};
