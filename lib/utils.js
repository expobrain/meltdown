'use strict';

var _       = require('lodash'),
    htmlmin = require('html-minifier');


function _ensureNodeArray(nodes) {
    if (_.isArray(nodes)) {
        return nodes.slice();
    } else if (nodes) {
        return [nodes];
    } else {
        return [];
    }
}


function getNodeChildren(node) {
    var children;

    switch (node.type) {
        case 'AssignmentExpression':
        case 'BinaryExpression':
            return [node.left, node.right];

        case 'BlockStatement':
        case "Program":
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

        case "Property":
            return [node.key, node.value];

        case "ReturnStatement":
            return node.argument ? [node.argument] : [];

        case "VariableDeclaration":
            return node.declarations.slice();

        case "VariableDeclarator":
            return [node.init];

        // --------------------------------------------------------------------
        // JSX
        // --------------------------------------------------------------------

        case "ArrowFunctionExpression":
            return node.params.slice().concat([node.body]);

        case "JSXAttribute":
            children = [node.name];

            if (node.value) {
                children.push(node.value);
            }

            return children;

        case "JSXElement":
            children = [node.openingElement].concat(node.children);

            if (node.closingElement) {
                children.push(node.closingElement);
            }

            return children;

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
        items = _ensureNodeArray(nodes);

    while (items.length) {
        item = items.pop();
        callback.call(thisArg, item);
        items.push.apply(items, getNodeChildren(item));
    }
}


function whileNodes(nodes, callback, thisArg) {
    var item,
        newItems,
        items = _ensureNodeArray(nodes);

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
        queue = _ensureNodeArray(nodes);

    while (queue.length) {
        node = queue.pop();

        if (callback.call(thisArg, node)) {
            return node;
        }

        queue.push.apply(queue, getNodeChildren(node));
    }
}


function minifyHtml(data) {
    return htmlmin.minify(data, {collapseWhitespace: true});
}


module.exports = {
    minifyHtml: minifyHtml,
    getNodeChildren: getNodeChildren,
    whileNodes: whileNodes,
    findNode: findNode,
    traverseTree: traverseTree
};
