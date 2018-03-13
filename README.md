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

let validator = vali.object({
    name: vali.required(),
    email: vali.required()
})

let form = {}

validator(form)
// { name: [ 'required' ], email: [ 'required' ] }
```

## Quickstart

`npm i --save valivali`

`let vali = require('valivali')`

## Usage

A validator is a function that takes a value as an argument and returns a data structure with errors.

```js
> vali.required()('')
[ 'required' ]
> vali.required()('this is valid')
[]
```

To check the validity of a result you can use `isValid`

```js
> vali.isValid(vali.required()(''))
false
> vali.isValid(vali.required()('this is valid'))
true
```

Validators are composable

```js
> let validator = vali.any(vali.number(), vali.string())
undefined
> validator('string')
[]
> validator(1)
[]
> validator({})
[ 'number', 'string' ]


> vali.all(vali.required(), vali.number())(0)
[ 'required' ]
> vali.all(vali.required(), vali.number())(1)
[]


> vali.object({ x: vali.required(), y: vali.number() })({ x: 0, y: 3 })
{ x: [ 'required' ], y: [] }
```

can include complex logic

```js
> validator = vali.when(vali.number(), vali.eq(2), vali.required())
[Function]
> validator(2)
[]
> validator(1)
[ 'eq' ]
> validator('')
[ 'required' ]
```

and can be customized for displaying error messages

```js
> vali.object({ email: vali.message(vali.required(), (errors) => 'Email is a required field') })({})
{ email: 'Email is a required field' }
```

## Creating custom validators

Since a validator is just a function that returns a data structure with errors, defining custom validators is as simple as defining functions

```js
> let isEven = (it) => it % 2 === 0 ? [] : ['isEven']
undefined
> vali.isValid(isEven(3))
false
> vali.isValid(isEven(4))
true
```

## License

valivali is released under [MIT License](https://opensource.org/licenses/MIT)
