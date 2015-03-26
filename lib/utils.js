var _ = require('lodash');


module.exports = {
    forEachNode: function(nodes, callback, thisArg) {
    	var item,
    		items = nodes.slice();

    	while (items.length) {
    		item = items.pop();
    		callback.call(thisArg, item);
    		items.push.apply(items, item.children())
    	}
    }
}
