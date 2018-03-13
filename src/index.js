let promise =           (fn) => new Promise(fn),
    resolved =          (value) => promise((resolve) => resolve(value)),
    sync =              (fn) => (value) => resolved(error(fn(value))),
    normalizeArrays =   (...errors) => [].concat(...errors).filter(Boolean),
    error =             (it) => normalizeArrays(it),
    typed =             (typeName) => () => sync(
                            (value) => typeof value !== typeName && 'invalidType'
                        ),
    asString =          (fn) => (it = '') => fn(it.toString()),
    asNumber =          (fn, radix=10) => (it) => fn(Number(it, radix)),

    countErrors =       (it) => {
                            if (typeof it === 'object') {
                                var n = 0
                                for (var s in it) {
                                    n += countErrors(it[s])
                                }

                                return n
                            } else {
                                return 1
                            }
                        },
    valid =             (it) => countErrors(it) === 0,

    transform =         (validator, fn) => (it) => validator(it).then(fn),
    compose =           (...validators) => (value) =>
                            promise((resolve) => {
                                let errors = [],
                                    newValidators = [...validators]

                                validators.forEach((it) =>
                                    it(value).then((result) => {
                                        errors.push(result)
                                        newValidators.pop()

                                        if (!newValidators.length)
                                            resolve(normalizeArrays(...errors))
                                    })
                                )
                            }),
    assign =            (...objects) => objects.reduce((a, b) => {
                            for (var s in b)
                                a[s] = b[s];
                            return a;
                        }, {}),
    withMessage =       (msg, fn) => transform(fn, (errors) => !valid(errors) && error(msg) || errors),

    validators = {
        any: {
            required:           () => sync((it) => !it && 'required'),
            empty:              () => withMessage('empty', validators.compositors.not(validators.any.required())),
            disallow:           (value) => sync((it) => it === value && 'disallowed')
        },
        types: {
            string:         typed('string'),
            number:         typed('number'),
            object:         typed('object'),
            boolean:        typed('boolean'),
            array:          () => sync((it) => !Array.isArray(it) && 'invalidType'),
            date:           () => sync((it) => !(it instanceof Date) && 'invalidType')
        },
        converters: {
            asDate:         (fn) => (value) => fn(new Date(value)),
            asString,
            asNumber
        },
        compositors: {
            not:            (fn) => (value) => fn(value).then((it) => error(valid(it) && 'inverse')),
            or:             (...validators) => (value) => promise((resolve) => {
                                let errors = [],
                                    newValidators = [...validators]

                                var done = false

                                validators.forEach((it) =>
                                    !done && it(value).then((result) => {
                                        newValidators.pop()

                                        if (!done) {
                                            if (valid(result)) {
                                                done = true
                                                resolve(result)
                                            } else {
                                                errors.push(result)
                                                if (!newValidators.length)
                                                    resolve(errors)
                                            }
                                        }
                                    })
                                )
                            }),
            withMessage,
            compose
        },
        helpers: {
            error,
            sync,
            valid
        },
        string: {
            minLength:      (n) => sync(asString((it) => it.length < n && 'minLength')),
            maxLength:      (n) => sync(asString((it) => it.length > n && 'maxLength')),
            between:        (min, max) => compose(
                                validators.string.minLength(min),
                                validators.string.maxLength(max)
                            ),
            regexp:         (re) => sync(asString((it) => !it.match(re) && 'regexp')),
            alpha:          () => validators.string.regexp(/^[A-z]*$/),
            num:            () => validators.string.regexp(/^[0-9]*$/),
            alphaNum:       () => validators.string.regexp(/^[A-z0-9]*$/),
        },
        number: {
            min:            (n) => compose(validators.number.decimal(), sync(asNumber((it) => it < n && 'min'))),
            max:            (n) => compose(validators.number.decimal(), sync(asNumber((it) => it > n && 'max'))),
            range:          (min, max) => compose(
                                validators.number.min(min),
                                validators.number.max(max)
                            ),
            integer:        () => sync(asNumber((it) => it % 1 !== 0 && 'integer')),
            decimal:        () => sync(asNumber((it) => !isFinite(it) && 'number'))
        },
        date: {
            isDate:         () => sync((it) => !isFinite(it) && 'isDate'),
            range:          (min, max) => validators.number.range(min, max)
        },
        collections: {
            field:          (name, validator) => (it) => validator(it[name]),
            object:         (fields) => {
                                var o = [];

                                for (var s in fields)
                                    ((name) =>
                                        o.push(transform(
                                            validators.collections.field(name, fields[name]),
                                            (it) => ({ [name]: it })
                                        ))
                                    )(s)

                                return transform(compose(module.exports.types.object(), ...o), (values) => assign(...values))
                            },
            array:          (validator) => compose(module.exports.types.array(), (value) => promise((resolve) => {
                                let errors = [],
                                    values = [...value]

                                values.forEach((it) =>
                                    validator(it).then((result) => {
                                        errors.push(result)
                                        values.pop()

                                        if (!values.length)
                                            resolve(errors)
                                    })
                                )
                            }))
        }
    }

module.exports = validators
