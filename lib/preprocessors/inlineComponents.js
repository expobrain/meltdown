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

    // Inline component into current node;
    // modify the original node to maintain references in the tree

    // ...set opening element
    node.openingElement.name.name = component.openingElement.name.name;
    node.openingElement.attributes = _.cloneDeep(
        component.openingElement.attributes
    );

    // ... copy chidren
    node.children = inlineChildren(component, node);

    // ...set closing element
    if (node.openingElement.selfClosing && !component.openingElement.selfClosing) {
        node.openingElement.selfClosing = false;
        node.closingElement = _.cloneDeep(component.closingElement);
    } else {
        node.closingElement.name.name = component.openingElement.name.name;
    }

    // Scan children for other inlines
    _.forEach(node.children, function (child) {
        findInlines(child, frame);
    });
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


module.exports = function (frame) {
    _.forEach(frame.exports, function (exportSymbol) {
        var node = frame.symbols[exportSymbol];

        findInlines(node, frame);
    });

    return frame;
};
