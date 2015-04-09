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


function inlineAttrs(inlinedNode, attrs) {
    utils.traverseTree([inlinedNode], function (node) {
        var needReplace = (
            node.type === 'MemberExpression' &&
            node.object.type === 'MemberExpression' &&
            node.object.object.type === 'ThisExpression' &&
            node.object.property.type === 'Identifier' &&
            node.object.property.name === 'props' &&
            node.property.type === 'Identifier' &&
            _.has(attrs, node.property.name)
        );

        if (needReplace) {
            var target = attrs[node.property.name];

            _.forIn(node, function (value, key) {
                if (!_.has(target, key)) {
                    delete node[key];
                }
            });

            _.forIn(target, function (value, key) {
                node[key] = _.cloneDeep(value);
            });
        }
    });

    return inlinedNode;
}


function extractComponentAttrs(node) {
    return _.chain(node.openingElement.attributes)
        .where(function (attr) {
            return attr.type === 'JSXAttribute';
        })
        .reduce(function (result, attr) {
            result[attr.name.name] = _.cloneDeep(attr.value.expression);
            return result;
        }, {})
        .value();
}


function inlineComponent(node, frame) {
    // Load component form symbols
    var componentName = node.openingElement.name.name,
        componentNode = frame.symbols[componentName];

    // Get component's arguments
    var componentAttrs = extractComponentAttrs(node);

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

    // ... replace attributes
    node = inlineAttrs(node, componentAttrs);

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
    return findInlines(frame.exports, frame);
};
