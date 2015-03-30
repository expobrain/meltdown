'use strict';

var _ = require('lodash');


function traverseTree(nodes, callback, thisArg) {
    var item,
        items = nodes.slice();

    while (items.length) {
        item = items.pop();
        callback.call(thisArg, item);
        items.push.apply(items, item.getChildren());
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

        queue.push.apply(queue, node.getChildren());
    }
}


module.exports = {
    whileNodes: whileNodes,
    findNode: findNode,
    traverseTree: traverseTree
};
