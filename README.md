https://github.com/estree/estree/blob/master/spec.md


To-do
-----

- Arrows function are not supperted, i.e. `(a, b) => {}`
- convert `className` attribute into `class`
- add support for `dangerouslySetInnerHTML`
- remove limitations on `module.exports` so any expression can be exported
- concatenation of expressions
- LOW PRIORITY: add support for Object.keys()
- on compiling Lodash.map() add check to test if iterable is an array or a
  dictionary (test that the `items` attribute is not null for dicts)
