'use strict';

var _ = require('lodash');


module.exports = {
    traverseTree: function(nodes, callback, thisArg) {
        var item,
            items = nodes.slice();

        while (items.length) {
            item = items.pop();
            callback.call(thisArg, item);
            items.push.apply(items, item.getChildren());
        }
    },

    whileNodes: function(nodes, callback, thisArg) {
        var item,
            newItems,
            items = nodes.slice();

        while (items.length) {
            item = items.pop()
            newItems = callback.call(thisArg, item);

            if (newItems) {
                items.push.apply(items, newItems);
            }
        }
    }
};
