let r = require('ramda')

let vali = require('../src/'),
    { sync } = vali.helpers,
    { required } = vali.any

const
    TRUTHY =    [true, 'foo', {}, [], 1, new Date],
    FALSY =     [false, '', null, undefined, NaN],
    STRING =    ['foo', '', 'Lorem ipsum dolor sit amet'],
    NUMBER =    [0, NaN, 1000, 0.0, 1.5, 1, Infinity],
    DATE =      [new Date],
    ARRAY =     [[], [1, 2, 3]],
    OBJECT =    [{}, null].concat(DATE, ARRAY),
    ALL =       TRUTHY.concat(FALSY, STRING, NUMBER, OBJECT, DATE, ARRAY)

let test =  (name, args, valid, invalid) => ({ name, args, valid, invalid }),
    dummy = (result) => sync(() => result),
    str =   (value) => typeof value === 'function'
                ? '[Function]'
                : JSON.stringify(value),
    allBut = (other) => r.without(other, ALL)


let tests = [
    test(
        'any.required', [],
        TRUTHY,
        FALSY
    ),
    test(
        'any.empty', [],
        FALSY,
        TRUTHY
    ),
    test(
        'types.string', [],
        STRING,
        allBut(STRING)
    ),
    test(
        'types.number', [],
        NUMBER,
        allBut(NUMBER)
    ),
    test(
        'types.object', [],
        OBJECT,
        allBut(OBJECT)
    ),
    test(
        'types.array', [],
        ARRAY,
        allBut(ARRAY)
    ),
    test(
        'types.date', [],
        DATE,
        allBut(DATE)
    ),
    test(
        'helpers.sync', [() => 'fail'],
        [],
        [undefined]
    ),
    test(
        'helpers.sync', [() => false],
        [undefined],
        []
    ),
    test(
        'string.minLength', [3],
        ['foo', 'foobar'],
        ['fa', '']
    ),
    test(
        'string.maxLength', [3],
        ['fa', 'foo', ''],
        ['bfoo', 'foobar']
    ),
    test(
        'string.between', [3, 6],
        ['foo', 'foobar'],
        ['fo', 'foobarbaz', '']
    ),
    test(
        'string.alpha', [],
        ['foo', ''],
        ['1', '23.24', 'hello.', 'hello world']
    ),
    test(
        'string.num', [],
        ['1', '', '2', '4000'],
        ['hello.', 'hello world']
    ),
    test(
        'string.alphaNum', [],
        ['1', '', '23', '4000', 'foo', 'qwerty123456'],
        ['hello!', 'hello world', '$']
    ),
    test(
        'string.regexp', [/^foo$/],
        ['foo'],
        ['foob', 'fo', '']
    ),
    test(
        'collections.field', ['a', required()],
        [{a: 'foo'}],
        [{b: 'foo'}]
    ),
    test(
        'collections.object', [{a: required(), b: required()}],
        [{a: 'foo', b: 'bar'}],
        [{}, {a: 'foo'}, {b: 'bar'}]
    ),
    test(
        'collections.array', [required()],
        [[1, 2, 3], ['a', 'b']],
        [[undefined, 3, 4], [false, null]]
    ),
    test(
        'compositors.or', [sync((it) => it % 2 !== 0), sync((it) => it % 3 !== 0)],
        [2, 3, 4, 6, 9],
        [5, 11, 13]
    ),
    test(
        'compositors.not', [dummy('wat')],
        ALL,
        []
    ),
    test(
        'compositors.not', [dummy()],
        [],
        ALL
    ),
    test(
        'number.min', [5],
        [5, 9, '5', '42.20'],
        [-4, 0, 4.9, NaN, 'not a number', Infinity]
    ),
    test(
        'number.max', [5],
        [-4, 0, 4.9, 5, '5'],
        [9, '42.20', NaN, 'not a number']
    ),
    test(
        'number.integer', [],
        [-4, 0, 5, 9, '5'],
        [4.9, '42.20', NaN, 'not a number']
    ),
    test(
        'number.decimal', [],
        [-4, 4.9, '42.20', 0, 5, 9, '5'],
        [NaN, 'not a number']
    ),
    test(
        'converters.asDate', [vali.date.isDate()],
        ['1900-1-1', '01.01.1900', '1900-1-1 0:00'],
        [NaN, 'not a number']
    ),
    test(
        'date.isDate', [],
        [new Date],
        [NaN, 'not a number']
    ),
    test(
        'date.range', [new Date('1900-01-01'), new Date('2000-01-01')],
        [new Date('1950-1-1')],
        [new Date]
    ),
]

describe('valivali', () => {
    r.pipe(
        r.forEach(({ name, args, valid, invalid }) => {
            let fn = r.path(name.split('.'), vali)(...args),
                def = name + '(' + args.map(str).join(', ') + ')'

            describe(def, () => {
                valid.forEach((value) => it('should accept ' + str(value), () =>
                    fn(value).then((errors) => vali.helpers.valid(errors).should.be.true)
                ))

                invalid.forEach((value) => it('should not accept ' + str(value), () =>
                    fn(value).then((errors) => vali.helpers.valid(errors).should.be.false)
                ))
            })
        })
    )(tests)

    describe('.helpers', () => {
        describe('.valid', () => {
            it('should accept empty array', () => {
                vali.helpers.valid([]).should.be.true
            })

            it('should not accept array with elements', () => {
                vali.helpers.valid(['foo']).should.be.false
            })

            it('should accept empty object', () => {
                vali.helpers.valid({}).should.be.true
            })

            it('should accept object with empty keys', () => {
                vali.helpers.valid({a: []}).should.be.true
            })

            it('should not accept object with elements', () => {
                vali.helpers.valid({foo: 'bar'}).should.be.false
            })
        })
    })

    describe('.compositors', () => {
        describe('.withMessage', () => {
            it('should resolve to given message when validator fails', () =>
                vali.compositors.withMessage('newMessage',
                    dummy('fail')()
                        .then((it) => it.should.deep.equal(['newMessage'])))
            )

            it('should return empty array when validator passes', () =>
                vali.compositors.withMessage('newMessage',
                    dummy(false)()
                        .then((it) => it.should.deep.equal([])))
            )
        })

        describe('.compose', () => {
            it('should merge errors from two validators', () =>
                vali.compositors.compose(dummy('foo'), dummy('bar'))()
                .then((it) => it.should.deep.equal(['foo', 'bar']))
            )
        })
    })
})
