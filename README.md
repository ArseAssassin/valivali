# valivali

valivali is a dead simple validation library for

* form validation
* API request validation
* type checking
* schema verification
* anything else you might need it for

## How it looks

```js
let vali = require('valivali')

let validator = vali.collections.object({
    name: vali.compositors.compose(vali.any.required(), vali.types.string(), vali.string.minLength(3)),
    email: vali.compositors.compose(vali.any.required(), vali.types.string(), vali.string.minLength(5))
})

let form = {}

validator(form).then(...)
// {name: ['required', 'type', 'minLength'], email: ['required', 'type', 'minLength']}
```

## Quickstart

`npm i --save -E valivali`

`let vali = require('valivali')`

## Usage

A validator is a function that returns a promise resolving to a data structure containing errors

```js
vali.any.required()(undefined).then(...)
// ['required']
```

This data structure can also be an object

```js
vali.collections.object({foo: vali.any.required()})({}).then(...)
// {foo: ['required']}
```

Validators are composable

```js
vali.compositors.compose(vali.any.required(), vali.types.string())(undefined).then(...)
// ['required', 'invalidType']
```

customizable

```js
vali.compositors.withMessage('my error message', vali.any.required())(undefined).then(...)
// ['my error message']
```

and extendable

```js
vali.compositors.compose(vali.any.required(), (value) => new Promise(...))(undefined).then(...)
// ['required', 'my custom validator']
```

You can validate strings

```js
vali.string.minLength(4)('foo').then(...)
// ['minLength']
```

numbers

```js
vali.number.integer()(0.4).then(...)
// ['integer']
```

dates

```js
vali.parsers.parseDate(vali.number.range(new Date('1900-01-01'), new Date('2000-01-01')))(new Date).then(...)
// ['max']
```

and even complex objects

```js
vali.collections.object({
    name: vali.any.required(),
    email: vali.compositors.or(vali.any.empty(), vali.string.regexp(/.+@.+\..+/)),
    purchases: vali.collections.array(vali.collections.object({
        itemId: vali.types.number(),
        count: vali.types.number()
    }))
})({ name: '', email: '', purchases: [{itemId: 100, count: 1}] }).then(...)
// { name: ['required'], email: [], purchases: [{itemId: [], count: []}]}
```

valivali also helps you figure out which results are valid

```js
vali.helpers.valid([]) // true
vali.helpers.valid(['error']) // false

vali.helpers.valid({foo: []}) // true
vali.helpers.valid({foo: ['error']}) // false
```

## Links

* [API Docs](docs.md)
