https://github.com/estree/estree/blob/master/spec.md


To-do
-----

- HIGH PRIORITY: refactore the code loader to use [`require.resolve()`][require_resolve]
- HIGH PRIORITY: add support for `react-router`
- concatenation of expressions
- remove limitations on `module.exports` so any expression can be exported
- on compiling Lodash.map() add check to test if iterable is an array or a
  dictionary (test that the `items` attribute is not null for dicts)
- LOW PRIORITY: add support for `dangerouslySetInnerHTML`
- LOW PRIORITY: add support for Object.keys()


[require_resolve]: https://nodejs.org/api/globals.html#globals_require_resolve
