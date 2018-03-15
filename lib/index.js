let r = require('ramda')

let isValid = (it) => typeof it === 'string' ? false : r.all(isValid, r.values(it)),
    all = (...fns) => (it) => {
        let fn = r.find((fn) => !isValid(fn(it)), fns)

        if (fn) {
            return fn(it)
        } else {
            return []
        }
    },
    type = (t) => (it) => typeof it === t ? [] : ['invalid-type:' + typeof it + '/' + t],
    regexp = (re) => all(
        type('string'),
        (it) => re.test(it) ? [] : ['regexp']
    ),
    isArray = () => (it) => Array.isArray(it) ? [] : ['array'],
    decorate = (fn, validator) => (it) => fn(validator(it)),
    prefixError = (prefix, validator) =>
        decorate(
            (it) => it.map((it) => prefix + ':' + it),
            validator
        ),
    required = () => (it) => it ? [] : ['required'],
    pass = r.always([])

let vali = {
    isValid,
    all,
    required,
    number: () => (it) => typeof it === 'number' ? [] : ['number'],
    string: () => (it) => typeof it === 'string' ? [] : ['string'],
    object: (it) => all(
        type('object'),
        (value) => {
            if (!it) {
                return []
            } else {
                let extraKey = r.find((key) => !it[key], r.keys(value))

                if (extraKey) {
                    return ['object:extra-key:' + extraKey]
                } else {
                    return r.mapObjIndexed((fn, key) => fn(value[key]), it)
                }
            }
        }
    ),
    any: (...validators) => (it) => {
        let fn = r.find((fn) => isValid(fn(it)), validators)

        if (fn) {
            return []
        } else {
            return r.unnest(validators.map((fn) => fn(it)))
        }
    },
    withFn: (fn, validator) => r.pipe(fn, validator),
    length: (validator) => vali.withFn(r.prop('length'), validator),
    lt: (it) => (value) => it > value ? ['lt'] : pass(),
    gt: (it) => (value) => it < value ? ['gt'] : pass(),
    empty: () => (it) => !it ? [] : ['empty'],
    array: (validator=pass) => all(
        isArray(),
        (it) => r.unnest(it.map(validator))
    ),
    elem: (index, validator) => all(
        required(),
        (it) => validator(it[index])
    ),
    enumeration: (...values) => (it) => r.contains(it, values) ? [] : ['enum'],
    eq: (value) => (it) => it === value ? [] : ['eq'],
    when: (fn, validator, otherwise=r.always([])) => (it) =>
        isValid(fn(it)) ? validator(it) : otherwise(it),
    fail: (msg) => r.always([msg]),
    prefixError,
    pass,
    message: (validator, fn) => (it) => {
        let errors = validator(it)

        if (isValid(errors)) {
            return errors
        } else {
            return fn(errors)
        }
    },
    regexp
}

module.exports = vali
