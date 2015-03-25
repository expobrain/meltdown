var annotate                = require('./preprocessors/annotate'),
    filterReactCreateClass  = require('./preprocessors/filterReactCreateClass');


module.exports = {
    annotate: annotate.process,
    filterReactCreateClass: filterReactCreateClass.process
};
