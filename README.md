# Contextual Proxy [![Node.js CI](https://github.com/3cp/contextual-proxy/actions/workflows/node.js.yml/badge.svg)](https://github.com/3cp/contextual-proxy/actions/workflows/node.js.yml)

Wrapped JS [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) with contextual variables and parent context chain.

Using Proxy, this is a simpler implementation of Aurelia's binding context ([Aurelia 1](https://github.com/aurelia/binding/blob/master/src/scope.js), [Aurelia 2](https://github.com/aurelia/aurelia/blob/master/packages/runtime/src/observation/binding-context.ts)).

> Proxy also means IE is not supported.

Not only implementation is simplified, but also the usage. Now this kind of proxy can be used as if it's a plain JavaScript object.

> Aurelia needs a full AST to implement a subset of JavaScript in order to execute an expression utilising binding context, because it's not transparent to access through parent context chain. With contextual proxy, it's now transparent. There is no need of an implementation of AST **at runtime** to execute an expression utilising this proxy, see [scoped-eval](https://github.com/3cp/scoped-eval) for more details.

## Import the contextual proxy
```
npm install contextual-proxy
```

```js
import proxy from "contextual-proxy";
// Or in CommonJS:
// const proxy = require("contextual-proxy").default;
```

## Create a proxy without any parent context or contextual variable
```js
const obj = {a: 1, b: 2};
const wrapped = proxy(obj);
```
This is almost same as the plain Proxy created by `const wrapped = new Proxy(obj, {});`.

> Note Proxy can only wrap `object`, not primitive value (string, number, boolean) or `null` (which is an `object`).

## Create a proxy with parent context
```js
const parent = {b: 1, c: 2};
const obj = {a: 1, b: 2};
const wrapped = proxy(obj, parent);
```

Now the parent object is somehow behave like a back-store (think about prototype chain), it can be explicitly accessed by `$parent` property.

> Note we didn't change anything on `obj` and `parent` objects themselves, contextual proxy chained them together without touching the original objects.

```js
wrapped.a; // 1
wrapped.b; // 2
wrapped.c; // 2

wrapped.$parent.a; // undefined
wrapped.$parent.b; // 1
wrapped.$parent.c; // 2
```

## Create a proxy with a chain of parent contexts
If parent contexts are all prepared by contextual proxy, it can support chain of parent contexts.

Use `$parent`, `$parent.$parent...` or `$parents` to access the chain of parent contexts.
```js
const grandParent = {foo: 'Foo'};
const wrappedGP = proxy(grandParent);
const parent = {b: 1, c: 2};
const wrappedP = proxy(parent, wrappedGP);
const obj = {a: 1, b: 2};
const wrapped = proxy(obj, wrappedP);

wrapped.foo; // 'Foo'

wrapped.$parent.foo; // 'Foo'
wrapped.$parent.$parent.foo; // 'Foo'
// Same as above two lines
wrapped.$parents[0].foo; // 'Foo'
wrapped.$parents[1].foo; // 'Foo'

wrapped.$parents.length; // 2
wrapped.$parent.$parents.length; // 1
```

## Add contextual variables
When wrapping target object, you can add contextual variables which only live in the proxy, not in the original target object.

By convention, contextual variables starts with `$` such as `$index`.

The following example is the kind of usage of contextual proxy in a view rendering or model validation.
```js
const classRoom = {
  year: 2,
  name: 'Courageous Kingfishers',
  students: [
    { name: 'Michael' },
    { name: 'Emma' }
  ]
];

const wrappedClassRoom = proxy(classRoom);

classRoom.students.forEach((student, i) => {
  const wrapped = proxy(
    student,
    wrappedClassRoom,
    {
      $index: i,
      $first: i === 0,
      $last: i === classRoom.students.length - 1
    }
  );
  wrapped.year; // 2
  wrapped.name; // Michael or Emma
  wrapped.$index: // 0 or 1
  wrapped.$parent.name; // Courageous Kingfishers
});
```

## Assignment operation
```js
const parent = {b: 1, c: 2};
const obj = {a: 1, b: 2};
const wrapped = proxy(obj, proxy(parent), {$index: 1});

wrapped.b = 3; // obj is now {a: 1, b: 3}
wrapped.c = 3; // parent is now {b: 1, c: 3}
wrapped.$parent.b = 2; // parent is now {b: 2, c: 3}

// obj and parent are unchanged, but contextual
// variable $index is changed from 1 to 2;
wrapped.$index = 2;
```

When you assign some variable not exists in obj, parent and contextual variables,
the proxy will create a new property on the obj or contextual variables.

```js
wrapped.$foo = 1; // creating contextual variable $foo with value 1
wrapped.foo = 2; // obj is now {a: 1, b: 3, foo: 2}
```

## License
MIT.
