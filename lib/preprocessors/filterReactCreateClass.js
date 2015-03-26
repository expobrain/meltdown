var _ 		 = require('lodash')
	annotate = require('./annotate').process;


module.exports.process = function (ast) {
	var newAst;

	// Raise exception if root node is not Program
	if (!ast || ast.type !== 'Program') {
		throw "Root node is not <Program>";
	}

	newAst = annotate({
		type: 'Program',
		body: []
	});

	// Drop branches without React.createClass
	_.forEach(ast.body, function (node) {
		var items = [node],
			item,
			found = false;

		while (!found && items.length) {
			item = items.pop();

			found = item.type === 'MemberExpression' &&
				(item.object.type === 'Identifier' && item.object.name === 'React') &&
				(item.property.type === 'Identifier' && item.property.name === 'createClass');

            if (found) {
            	newAst.body.push(node);
            } else {
				items.push.apply(items, item.children());
            }
		};
	});

	return newAst;
};
