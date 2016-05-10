## valivali.any

* `required`: accepts only [truthy values](https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
* `empty`: rejects [truthy values](https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
* `disallow(value)`: rejects values that are strictly equal to given value

## valivali.string

* `minLength(n)`: allows only string of length `n` or longer
* `maxLength(n)`: allows only string of length `n` or less
* `between(min, max)`: same as `compose(minLength(min), maxLength(max))`
* `regexp(re)`: allows only values that match `re`
* `alpha()`: allows only alphabetical values
* `num()`: allows only numerical values
* `alphaNum()`: allows only alphanumerical values

## valivali.number

* `min(n)`: allows only values greater than or equal to `n`
* `max(n)`: allows only values less than or equal to `n`
* `range(mn, mx)`: same as `compose(min(mn), max(mx))`
* `integer()`: allows only integer values
* `decimal()`: allows only numeric values

## valivali.date

* `isDate()`: combine with `converters.asDate` to validate that value can be parsed as a JavaScript date

## valivali.compositors

* `compose(...validators)`: composes all validators into a single one, appending their results to a single array
* `not(validator)`: creates an inverse validator, passing only when value is not valid and returning `['inverse']` when the validator doesn't pass
* `or(...validators)`: creates a validator that passes if value passes any of the given validators
* `withMessage(msg, validator)`: replaces validator's error message with `msg`

## valivali.collections

* `field(name, validator)`: allows only an object where property `name` passes `validator`
* `object(fields)`: accepts `fields` as an object - allows only object where all fields are valid
* `array(validator)`: accepts arrays where all elements pass `validator`

## valivali.types

* `string()`: accepts only strings using `typeof` comparison
* `number()`: accepts only numbers using `typeof` comparison
* `object()`: accepts only objects using `typeof` comparison
* `boolean()`: accepts only booleans using `typeof` comparison
* `array()`: accepts only arrays - uses `Array.isArray`
* `date()`: accepts only dates using `instanceof Date`

## valivali.converters

* `asNumber(validator, radix=10)`: converts value to number using `Number` before applying validator
* `asDate(validator)`: parses value as a date using `new Date(value)` before invoking validator
* `asString(validator)`: creates a validator that converts value to string using `.toString()` before invoking validator - `undefined` coverts to an empty string

## valivali.helpers

* `error(msg)`: converts `msg` into an error message, dropping falsy values and wrapping string in an array
* `sync(fn)`: creates a synchronous validator - `fn` is invoked with value and its result is converted using `error`
* `valid(error)`: returns true if given `error` contains any error messages
