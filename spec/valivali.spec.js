let validators = require('../lib/'),
    r = require('ramda')

let expectations = (fn, expectations) =>
    expectations.forEach(([name, param, value, result]) => {
        it('should ' + name, () => {
            expect(fn(...param)(value)).toEqual(result)
        })
    }),
    pass = r.always([]),
    fail = r.always(['fail'])

describe('.validators', () => {
    describe('.isValid', () => {
        it('should pass on empty values', () => {
            expect(validators.isValid([])).toBe(true)
            expect(validators.isValid([[]])).toBe(true)
            expect(validators.isValid({})).toBe(true)
            expect(validators.isValid({ foo: [] })).toBe(true)
            expect(validators.isValid({ foo: [[], []] })).toBe(true)
        })

        it('should fail on non-empty values', () => {
            expect(validators.isValid(['foo'])).toBe(false)
            expect(validators.isValid([''])).toBe(false)
            expect(validators.isValid({
                foo: ['bar']
            })).toBe(false)
            expect(validators.isValid({
                foo: [{
                    bar: 'baz'
                }]
            })).toBe(false)
        })
    })

    describe('.all', () => {
        expectations(validators.all, [
            ['pass on no validators', [], 2, []],
            ['fail on failing validator', [fail], 2, ['fail']],
            ['fail on first failing validator',
                [pass, fail],
                2,
                ['fail']
            ],
        ])
    })

    describe('.number', () => {
        expectations(validators.number, [
            ['pass on numbers', [], 3, []],
            ['pass on numbers', [], 3.5, []],
            ['not pass on non-numbers', [], {}, ['number']],
            ['not pass on non-numbers', [], [], ['number']],
        ])
    })

    describe('.string', () => {
        expectations(validators.string, [
            ['pass on string', [], '3', []],
            ['not pass on non-string', [], [], ['string']],
        ])
    })

    describe('.object', () => {
        expectations(validators.object, [
            ['pass on empty object', [], {}, []],
            ['not pass on non-object', [], 2, ['invalid-type:number/object']],
            ['not pass on extra keys',
                [{}],
                { foo: 'boo' },
                ['object:extra-key:foo']
            ],
            ['not pass on failing child validator',
                [{ foo: () => ['boo'] }],
                {},
                { foo: ['boo'] }
            ],
        ])
    })

    describe('.any', () => {
        expectations(validators.any, [
            ['pass on no validators', [], '', []],
            ['pass on any passing validators', [pass, fail], '', []],
            ['fail on only failing validators', [fail], '', ['fail']]
        ])
    })

    describe('.empty', () => {
        expectations(validators.empty, [
            ['pass on non-truthy values', [], '', []],
            ['pass on non-truthy values', [], false, []],
            ['pass on non-truthy values', [], undefined, []],
            ['pass on non-truthy values', [], 0, []],
            ['pass on non-truthy values', [], null, []],
            ['fail on truthy values', [], true, ['empty']],
            ['fail on truthy values', [], 'true', ['empty']],
            ['fail on truthy values', [], {}, ['empty']],
        ])
    })

    describe('.array', () => {
        expectations(validators.array, [
            ['pass for arrays', [], [], []],
            ['always pass for empty arrays', [fail], [], []],
            ['pass on arrays that pass child validator', [pass], [], []],
            ['fail for non-arrays', [], '', ['array']],
            ['fail for arrays that fail child validator',
                [fail],
                [1],
                ['fail']],
        ])
    })

    describe('.elem', () => {
        expectations(validators.elem, [
            ['pass for arrays that pass child validator',
                [0, pass],
                [2],
                []],
            ['fail for arrays that fail child validator',
                [0, fail],
                [2],
                ['fail']],
            ['fail for undefined', [0, pass], undefined, ['required']],
            ['fail for null', [0, pass], null, ['required']]
        ])
    })

    describe('.enum', () => {
        expectations(validators.enumeration, [
            ['pass for any parameter', [0], 0, []],
            ['pass for any parameter', [0, 2], 2, []],
            ['fail for a non-parameter', [0, 2], 3, ['enum']]
        ])
    })

    describe('.eq', () => {
        expectations(validators.eq, [
            ['pass for first parameter', [0], 0, []],
            ['fail for value not passed as a value', [0], 1, ['eq']],
        ])
    })

    describe('.when', () => {
        expectations(validators.when, [
            ['apply second validator when first validator passes',
                [pass, pass, fail], 0, []],
            ['apply second validator when first validator passes',
                [pass, fail, pass], 0, ['fail']],
            ['apply third validator when first validator fails',
                [fail, pass, fail], 0, ['fail']],
            ['apply third validator when first validator fails',
                [fail, fail, pass], 0, []],
        ])
    })

    describe('.fail', () => {
        expectations(validators.fail, [
            ['fail with message',
                ['failure'], 0, ['failure']]
            ])
    })
})
