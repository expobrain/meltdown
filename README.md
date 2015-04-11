Meltdown
========


*WARNING: THIS PROJECT IS STILL IN ALPHA STAGE SO IT STILL HAS SOME LIMITATIONS
AND/OR BUGS; USE IT AT YOUR OWN RISKS. ANY CONTRIBUTION OR FEEDBACK IS
WELCOME!*


Introduction
------------

This is a translator from React source code into Django template files.

The main problem using React on the server side is that if you are not running
Node.js to be able to render react component you need to launch a Node.js
instance. This project is trying to solve this problem by converting the
content of the `render()` method into a Django native template so there is no
need to run an extra Node.js instance anymore.



https://github.com/estree/estree/blob/master/spec.md


To-do
-----

- HIGH PRIORITY: add support for ES6
- concatenation of expressions
- remove limitations on `module.exports` so any expression can be exported
- on compiling Lodash.map() add check to test if iterable is an array or a
  dictionary (test that the `items` attribute is not null for dicts)
- LOW PRIORITY: add support for `dangerouslySetInnerHTML`
- LOW PRIORITY: add support for Object.keys()


[require_resolve]: https://nodejs.org/api/globals.html#globals_require_resolve
