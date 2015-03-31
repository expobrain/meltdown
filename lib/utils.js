'use strict';

var _ = require('lodash');


function getNodeChildren(node) {

    switch (node.type) {

        case 'AssignmentExpression':
        case 'BinaryExpression':
            return [node.left, node.right];

        case 'BlockStatement':
            return node.body.slice();

        case "CallExpression":
            return [node.callee].concat(node.arguments.slice());

        case 'ConditionalExpression':
            return [node.test, node.consequent, node.alternate];

        case 'ExpressionStatement':
            return [node.expression];

        case "FunctionExpression":
            return [node.body];

        case "Literal":
            return (node.value && node.value.type) ? [node.value] : [];

        case "MemberExpression":
            return [node.object, node.property];

        case "ObjectExpression":
            return node.properties.slice();

        case "Program":
            return node.body.slice();

        case "Property":
            return [node.key, node.value];

        case "ReturnStatement":
            return [node.argument];

        case "VariableDeclaration":
            return node.declarations.slice();

        case "VariableDeclarator":
            return [node.init];

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "ArrowFunctionExpression":
            return node.body.slice();

        case "JSXAttribute":
            return [node.name, node.value];

        case "JSXElement":
            return [node.openingElement]
                .concat(node.children)
                .concat(node.closingElement);

        case "JSXExpressionContainer":
            return [node.expression];

        case "JSXOpeningElement":
            return node.attributes.slice();

        default:
            return [];
    }
}


function traverseTree(nodes, callback, thisArg) {
    var item,
        items = nodes.slice();

    while (items.length) {
        item = items.pop();
        callback.call(thisArg, item);
        items.push.apply(items, getNodeChildren(item));
    }
}


function whileNodes(nodes, callback, thisArg) {
    var item,
        newItems,
        items = nodes.slice();

    while (items.length) {
        item = items.pop();
        newItems = callback.call(thisArg, item);

        if (newItems) {
            items.push.apply(items, newItems);
        }
    }
}


function findNode(nodes, callback, thisArg) {
    var node,
        queue = nodes.slice();

    while (queue.length) {
        node = queue.pop();

        if (callback.call(thisArg, node)) {
            return node;
        }

        queue.push.apply(queue, getNodeChildren(node));
    }
}


module.exports = {
    getNodeChildren: getNodeChildren,
    whileNodes: whileNodes,
    findNode: findNode,
    traverseTree: traverseTree
};
