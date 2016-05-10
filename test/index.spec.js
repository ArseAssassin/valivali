let r = require('ramda')

let vali = require('../src/'),
    { sync } = vali.helpers,
    { required } = vali.any

let test =  (name, args, valid, invalid) => ({ name, args, valid, invalid }),
    dummy = (result) => sync(() => result),
    str =   (value) => typeof value === 'function'
                ? '[Function]'
                : JSON.stringify(value)

let tests = [
    test(
        'any.required', [],
        ['a', 1, true, [], {}],
        ['', 0, false, null, undefined]
    ),
    test(
        'any.empty', [],
        ['', 0, false, null, undefined],
        ['a', 1, true, [], {}]
    ),
    test(
        'types.string', [],
        ['', 'foo'],
        [1, {}, [], undefined, null, false, true]
    ),
    test(
        'types.number', [],
        [0, NaN, 1000],
        ['1', {}, [], undefined, null, false, true]
    ),
    test(
        'types.object', [],
        [{}, [], new Date],
        ['1', undefined, false, true]
    ),
    test(
        'types.array', [],
        [[]],
        ['1', new Date, {}, undefined, false, true]
    ),
    test(
        'types.date', [],
        [new Date],
        ['1', {}, [], undefined, false, true]
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
        'collections.field', ['a', required()],
        [{a: 'foo'}],
        [{b: 'foo'}]
    ),
    test(
        'collections.object', [{a: required(), b: required()}],
        [{a: 'foo', b: 'bar'}],
        [{}]
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
    )

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
