'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var promise = function promise(fn) {
    return new Promise(fn);
},
    resolved = function resolved(value) {
    return promise(function (resolve) {
        return resolve(value);
    });
},
    sync = function sync(fn) {
    return function (value) {
        return resolved(error(fn(value)));
    };
},
    normalizeArrays = function normalizeArrays() {
    var _ref;

    return (_ref = []).concat.apply(_ref, arguments).filter(Boolean);
},
    error = function error(it) {
    return normalizeArrays(it);
},
    typed = function typed(typeName) {
    return function () {
        return sync(function (value) {
            return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== typeName && 'invalidType';
        });
    };
},
    asString = function asString(fn) {
    return function () {
        var it = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
        return fn(it.toString());
    };
},
    countErrors = function countErrors(it) {
    return it.length !== undefined ? it.length : function () {
        var n = 0;
        for (var s in it) {
            n += countErrors(it[s]);
        }

        return n;
    }();
},
    valid = function valid(it) {
    return countErrors(it) === 0;
},
    transform = function transform(validator, fn) {
    return function (it) {
        return validator(it).then(fn);
    };
},
    compose = function compose() {
    for (var _len = arguments.length, validators = Array(_len), _key = 0; _key < _len; _key++) {
        validators[_key] = arguments[_key];
    }

    return function (value) {
        return promise(function (resolve) {
            var errors = [],
                newValidators = [].concat(validators);

            validators.forEach(function (it) {
                return it(value).then(function (result) {
                    errors.push(result);
                    newValidators.pop();

                    if (!newValidators.length) resolve(normalizeArrays.apply(undefined, errors));
                });
            });
        });
    };
},
    assign = function assign() {
    for (var _len2 = arguments.length, objects = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        objects[_key2] = arguments[_key2];
    }

    return objects.reduce(function (a, b) {
        for (var s in b) {
            a[s] = b[s];
        }return a;
    }, {});
},
    withMessage = function withMessage(msg, fn) {
    return transform(fn, function (errors) {
        return !valid(errors) && msg;
    });
},
    validators = {
    any: {
        required: function required() {
            return sync(function (it) {
                return !it && 'required';
            });
        },
        empty: function empty() {
            return validators.compositors.not(validators.any.required());
        },
        disallow: function disallow(value) {
            return sync(function (it) {
                return it === value && 'disallowed';
            });
        }
    },
    types: {
        string: typed('string'),
        number: typed('number'),
        object: typed('object'),
        boolean: typed('boolean'),
        array: function array() {
            return sync(function (it) {
                return !Array.isArray(it) && 'invalidType';
            });
        },
        date: function date() {
            return sync(function (it) {
                return !(it instanceof Date) && 'invalidType';
            });
        },
        typed: typed
    },
    parsers: {
        parseNumber: function parseNumber(fn) {
            var radix = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];
            return function (value) {
                return fn(Number(value, radix));
            };
        },
        parseDate: function parseDate(fn) {
            return function (value) {
                return fn(new Date(value));
            };
        }
    },
    compositors: {
        not: function not(fn) {
            return function (value) {
                return fn(value).then(function (it) {
                    return error(valid(it) && 'inverse');
                });
            };
        },
        or: function or() {
            for (var _len3 = arguments.length, validators = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                validators[_key3] = arguments[_key3];
            }

            return function (value) {
                return promise(function (resolve) {
                    var errors = [],
                        newValidators = [].concat(validators);

                    var done = false;

                    validators.forEach(function (it) {
                        return !done && it(value).then(function (result) {
                            newValidators.pop();

                            if (!done) {
                                if (valid(result)) {
                                    done = true;
                                    resolve(result);
                                } else {
                                    errors.push(result);
                                    if (!newValidators.length) resolve(errors);
                                }
                            }
                        });
                    });
                });
            };
        },
        asString: asString,
        withMessage: withMessage,
        compose: compose
    },
    helpers: {
        sync: sync,
        valid: valid
    },
    string: {
        minLength: function minLength(n) {
            return sync(asString(function (it) {
                return it.length < n && 'minLength';
            }));
        },
        maxLength: function maxLength(n) {
            return sync(asString(function (it) {
                return it.length > n && 'maxLength';
            }));
        },
        between: function between(min, max) {
            return compose(validators.string.minLength(min), validators.string.maxLength(max));
        },
        regexp: function regexp(re) {
            return sync(function () {
                var it = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
                return !it.match(re) && 'regexp';
            });
        },
        alpha: function alpha() {
            return validators.regexp(/^[A-z]*$/);
        },
        num: function num() {
            return validators.regexp(/^[0-9]*$/);
        },
        alphaNum: function alphaNum() {
            return validators.regexp(/^[A-z0-9]*$/);
        }
    },
    number: {
        min: function min(n) {
            return sync(function (it) {
                return it < n && 'min';
            });
        },
        max: function max(n) {
            return sync(function (it) {
                return it > n && 'max';
            });
        },
        range: function range(min, max) {
            return compose(validators.number.min(min), validators.number.max(max));
        },
        integer: function integer() {
            return sync(function (it) {
                return it % 1 !== 0 && 'integer';
            });
        },
        number: function number() {
            return sync(function (it) {
                return !isFinite(it) && 'number';
            });
        }
    },
    collections: {
        field: function field(name, validator) {
            return function (it) {
                return validator(it[name]);
            };
        },
        object: function object(fields) {
            var o = [];

            for (var s in fields) {
                (function (name) {
                    return o.push(transform(validators.collections.field(name, fields[name]), function (it) {
                        return _defineProperty({}, name, it);
                    }));
                })(s);
            }return transform(compose.apply(undefined, o), function (values) {
                return assign.apply(undefined, _toConsumableArray(values));
            });
        },
        array: function array(validator) {
            return function (value) {
                return promise(function (resolve) {
                    var errors = [],
                        values = [].concat(_toConsumableArray(value));

                    values.forEach(function (it) {
                        return validator(it).then(function (result) {
                            errors.push(result);
                            values.pop();

                            if (!values.length) resolve(normalizeArrays.apply(undefined, errors));
                        });
                    });
                });
            };
        }
    }
};

module.exports = validators;