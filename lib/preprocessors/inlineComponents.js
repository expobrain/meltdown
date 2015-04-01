'use strict';

var _         = require('lodash'),
    debug     = require('debug')('inlineComponents'),

    stringify = require('../stringify'),
    utils     = require('../utils');


function inlineChildren(componentNode, parentNode) {
    // Inline component into parent node
    componentNode = _.cloneDeep(componentNode);

    utils.traverseTree([componentNode], function (node) {
        if (node.type === 'JSXElement') {
            _.forEach(node.children.slice(), function (child, index) {
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

    // Return children
    return componentNode.children;
}


function inlineComponent(node, frame) {
    // Load component form symbols
    var componentName = node.openingElement.name.name,
        componentNode = frame.symbols[componentName];

    // Extract AST from component to inline
    componentNode = utils.findNode([componentNode], function (childNode) {
        return childNode.type === 'JSXElement';
    });

    debug('Inlining ' + componentName + '...');

    // Inline component into current node;
    // modify the original node to maintain references in the tree

    // ...set opening element
    node.openingElement.name.name = componentNode.openingElement.name.name;
    node.openingElement.attributes = _.cloneDeep(
        componentNode.openingElement.attributes
    );

    // ... copy children
    node.children = inlineChildren(componentNode, node);

    // ...set closing element
    if (node.openingElement.selfClosing && !componentNode.openingElement.selfClosing) {
        node.openingElement.selfClosing = false;
        node.closingElement = _.cloneDeep(componentNode.closingElement);
    } else {
        node.closingElement.name.name = componentNode.openingElement.name.name;
    }
}


function findInlines(rootNode, frame) {
    utils.traverseTree(rootNode, function (node) {
        // Check if needs inline
        var needInline = node.type === 'JSXElement' &&
            node.openingElement.type === 'JSXOpeningElement' &&
            node.openingElement.name.type === 'JSXIdentifier' &&
            _.has(frame.symbols, node.openingElement.name.name);

        if (needInline) {
            inlineComponent(node, frame);
        }
    });

    return frame;
}


module.exports = function (frame) {
    findInlines(frame.exports, frame);
    //_.forEach(frame.exports, function (exportSymbol) {
    //    var node = frame.symbols[exportSymbol];
    //
    //    findInlines(node, frame);
    //});

    return frame;
};
