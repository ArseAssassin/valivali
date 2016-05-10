let promise =           (fn) => new Promise(fn),
    resolved =          (value) => promise((resolve) => resolve(value)),
    sync =              (fn) => (value) => resolved(error(fn(value))),
    normalizeArrays =   (...errors) => [].concat(...errors).filter(Boolean),
    error =             (it) => normalizeArrays(it),
    typed =             (typeName) => () => sync(
                            (value) => typeof value !== typeName && 'invalidType'
                        ),

    countErrors =       (it) => it.length !== undefined
                                    ? it.length
                                    : (() => {
                                        var n = 0;
                                        for (var s in it) {
                                            n += countErrors(it[s]);
                                        }

                                        return n;
                                    })(),
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
    withMessage =       (msg, fn) => transform(fn, (errors) => !valid(errors) && msg),

    validators = {
        required:           () => sync((it) => !it && 'required'),
        empty:              () => validators.compositors.not(validators.required()),
        types: {
            string:         typed('string'),
            number:         typed('number'),
            object:         typed('object'),
            boolean:        typed('boolean'),
            array:          () => sync((it) => !Array.isArray(it) && 'invalidType'),
            date:           () => sync((it) => !(it instanceof Date) && 'invalidType'),
            typed
        },
        parsers: {
            parseNumber:    (fn, radix=10) => (value) => fn(Number(value, radix)),
            parseDate:      (fn) => (value) => fn(new Date(value)),
        },
        compositors: {
            not:            (fn) => (value) => fn(value).then((it) => error(valid(it) && 'inverse')),
            withMessage,    
            compose
        },
        helpers: {
            sync,
            valid
        },
        string: {
            minLength:      (n) => sync((it) => it.length < n && 'minLength'),
            maxLength:      (n) => sync((it) => it.length > n && 'maxLength'),
            between:        (min, max) => compose(
                                validators.string.minLength(min), 
                                validators.string.maxLength(max)
                            ),
            regexp:         (re) => sync((it) => !it.match(re) && 'regexp'),
            alpha:          () => validators.regexp(/^[A-z]*$/),
            num:            () => validators.regexp(/^[0-9]*$/),
            alphaNum:       () => validators.regexp(/^[A-z0-9]*$/),
        },
        number: {
            min:            (n) => sync((it) => it < n && 'min'),
            max:            (n) => sync((it) => it > n && 'max'),
            range:          (min, max) => compose(
                                validators.number.min(min),
                                validators.number.max(max)
                            ),
            integer:        () => sync((it) => it % 1 !== 0 && 'integer'),
            number:         () => sync((it) => !isFinite(it) && 'number')
        },
        collections: {
            field:          (name, validator) => (it) => validator(it[name]),
            fields:         (fields) => {
                                var o = [];

                                for (var s in fields)
                                    ((name) => 
                                        o.push(transform(
                                            validators.collections.field(name, fields[name]),
                                            (it) => ({ [name]: it })
                                        ))
                                    )(s)

                                return transform(compose(...o), (values) => assign(...values))
                            },
            array:          (validator) => (value) => promise((resolve) => {
                                let errors = [],
                                    values = [...value]

                                values.forEach((it) => 
                                    validator(it).then((result) => {
                                        errors.push(result)
                                        values.pop()

                                        if (!values.length)
                                            resolve(normalizeArrays(...errors))
                                    })
                                )
                            })
        },
        conditionals: {
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
                            })
                            
        }
    }

module.exports = validators