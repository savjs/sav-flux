var app = (function (Vue,VueRouter) {
Vue = 'default' in Vue ? Vue['default'] : Vue;
VueRouter = 'default' in VueRouter ? VueRouter['default'] : VueRouter;

function toStringType(val) {
  return Object.prototype.toString.call(val).slice(8, -1);
}

const isArray = Array.isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isObject(arg) {
  return toStringType(arg) === 'Object' && arg !== null;
}

function isUndefined(arg) {
  return arg === undefined;
}

function isPromise(obj) {
  return obj && isFunction(obj.then);
}

function defined(val) {
  return val !== 'undefined';
}

let probe = {
  Map: defined(typeof Map),
  Proxy: defined(typeof Proxy),
  MessageChannel: defined(typeof MessageChannel),
  localStorage: defined(typeof localStorage),
  XMLHttpRequest: defined(typeof XMLHttpRequest),
  MutationObserver: defined(typeof MutationObserver),
  FormData: defined(typeof FormData),
  window: defined(typeof window),
  document: defined(typeof document)
};

/*
 * @Description      URL解析
 * @File             url.js
 * @Auth             jetiny@hfjy.com
 */

// jsuri https://code.google.com/r/jonhwendell-jsuri/
// https://username:password@www.test.com:8080/path/index.html?this=that&some=thing#content
const REKeys = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
const URL_RE = /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#/]*\.[^?#/.]+(?:[?#]|$)))*\/?)?([^?#/]*))(?:\?([^#]*))?(?:#(.*))?)/;

function parseUrl(str) {
  let _uri = {};
  let _m = URL_RE.exec(str || '');
  let _i = REKeys.length;
  while (_i--) {
    _uri[REKeys[_i]] = _m[_i] || '';
  }
  return _uri;
}

function stringifyUrl(uri) {
  let str = '';
  if (uri) {
    if (uri.host) {
      if (uri.protocol) str += uri.protocol + ':';
      str += '//';
      if (uri.user) str += uri.user + ':';
      if (uri.password) str += uri.password + '@';
      str += uri.host;
      if (uri.port) str += ':' + uri.port;
    }
    str += uri.path || '';
    if (uri.query) str += '?' + uri.query;
    if (uri.anchor) str += '#' + uri.anchor;
  }
  return str;
}

const _encode = encodeURIComponent;
const r20 = /%20/g;
const rbracket = /\[]$/;

function buildParams(prefix, obj, add) {
  if (Array.isArray(obj)) {
    // Serialize array item.
    obj.forEach(function (v, i) {
      if (rbracket.test(prefix)) {
        // Treat each array item as a scalar.
        add(prefix, v);
      } else {
        // Item is non-scalar (array or object), encode its numeric index.
        buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, add);
      }
    });
  } else if (isObject(obj)) {
    // Serialize object item.
    for (let name in obj) {
      buildParams(prefix + '[' + name + ']', obj[name], add);
    }
  } else {
    // Serialize scalar item.
    add(prefix, obj);
  }
}

// # http://stackoverflow.com/questions/1131630/the-param-inverse-function-in-javascript-jquery
// a[b]=1&a[c]=2&d[]=3&d[]=4&d[2][e]=5 <=> { a: { b: 1, c: 2 }, d: [ 3, 4, { e: 5 } ] }
function parseQuery(str, opts = {}) {
  let _querys = {};
  decodeURIComponent(str || '').replace(/\+/g, ' ')
  // (optional no-capturing & )(key)=(value)
  .replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, _name, _value) {
    if (_name) {
      let _path, _acc, _tmp, _ref;
      (_path = []).unshift(_name = _name.replace(/\[([^\]]*)]/g, function ($0, _k) {
        _path.push(_k);
        return '';
      }));
      _ref = _querys;
      for (let j = 0; j < _path.length - 1; j++) {
        _acc = _path[j];
        _tmp = _path[j + 1];
        if (!_ref[_acc]) {
          _ref[_acc] = _tmp === '' || /^[0-9]+$/.test(_tmp) ? [] : {};
        }
        _ref = _ref[_acc];
      }
      if (opts.boolval) {
        // first
        if (_value === 'true') {
          _value = true;
        } else if (_value === 'false') {
          _value = false;
        }
      } else if (opts.intval) {
        // skip "true" & "false"
        if (_tmp = parseInt(_value) === _value) {
          _value = _tmp;
        }
      }
      if ((_acc = _path[_path.length - 1]) === '') {
        _ref.push(_value);
      } else {
        _ref[_acc] = _value;
      }
    }
  });
  return _querys;
}

function stringifyQuery(query) {
  // # http://api.jquery.com/jQuery.param
  let _add = (key, value) => {
    /* jshint eqnull:true */
    _str.push(_encode(key) + '=' + (value === null || value === undefined ? '' : _encode(value)));
    // _str.push(( key ) + "=" +  (value == null ? "" : ( value )));
  };
  let _str = [];
  query || (query = {});
  for (let x in query) {
    buildParams(x, query[x], _add);
  }
  return _str.join('&').replace(r20, '+');
}

function extend() {
  // form jQuery & remove this
  let options, name, src, copy, copyIsArray, clone;
  let target = arguments[0] || {};
  let i = 1;
  let length = arguments.length;
  let deep = false;
  if (isBoolean(target)) {
    deep = target;
    target = arguments[i] || {};
    i++;
  }
  if (typeof target !== 'object' && !isFunction(target)) {
    target = {};
  }
  for (; i < length; i++) {
    options = arguments[i];
    /* jshint eqnull:true */
    if (options != null) {
      for (name in options) {
        src = target[name];
        copy = options[name];
        if (target !== copy) {
          if (deep && copy && (isObject(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];
            } else {
              clone = src && isObject(src) ? src : {};
            }
            target[name] = extend(deep, clone, copy);
          } else {
            target[name] = copy;
          }
        }
      }
    }
  }
  return target;
}

function clone(val) {
  if (isArray(val)) {
    return extend(true, [], val);
  } else if (isObject(val)) {
    return extend(true, {}, val);
  }
  return extend(true, [], [val])[0];
}

function prop(target, key, value) {
  if (isObject(key)) {
    for (let name in key) {
      Object.defineProperty(target, name, { value: key[name], writable: true, configurable: true });
    }
  } else {
    Object.defineProperty(target, key, { value, writable: true, configurable: true });
  }
}

function makePropFunc(target, propName) {
  if (!target._props_) {
    prop(target, '_props_', ['_props_']);
  }
  let props = target._props_;
  return (key, value) => {
    if (isObject(key)) {
      for (let name in key) {
        Object.defineProperty(target, name, { [`${propName}`]: key[name], writable: true, configurable: true });
        props.push(name);
      }
    } else {
      let descriptor = { [`${propName}`]: value, configurable: true };
      if (propName === 'value') {
        descriptor.writable = true;
      }
      Object.defineProperty(target, key, descriptor);
      props.push(key);
    }
  };
}

function bindEvent(target) {
  let _events = {};
  prop(target, 'on', (event, fn) => {
    (_events[event] || (_events[event] = [])).push(fn);
  });

  prop(target, 'before', (event, fn) => {
    (_events[event] || (_events[event] = [])).unshift(fn);
  });

  prop(target, 'off', (event, fn) => {
    if (_events[event]) {
      let list = _events[event];
      if (fn) {
        let pos = list.indexOf(fn);
        if (pos !== -1) {
          list.splice(pos, 1);
        }
      } else {
        delete _events[event];
      }
    }
  });

  prop(target, 'once', (event, fn) => {
    let once = (...args) => {
      target.off(event, fn);
      fn(...args);
    };
    target.on(event, once);
  });

  prop(target, 'subscribe', (event, fn) => {
    target.on(event, fn);
    return () => {
      target.off(event, fn);
    };
  });

  prop(target, 'emit', (event, ...args) => {
    if (_events[event]) {
      let list = _events[event].slice();
      let fn;
      while (fn = list.shift()) {
        fn(...args);
      }
    }
  });
}

function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }
  let len = arr.length;
  let i = -1;
  while (i++ < len) {
    let j = i + 1;
    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
}

function isPromiseLike(obj) {
  return !!(obj && obj.then);
}

let PROMISE = Promise;
let promise = {
  resolve: PROMISE.resolve.bind(PROMISE),
  reject: PROMISE.reject.bind(PROMISE),
  all: PROMISE.all.bind(PROMISE),
  then: (fn, reject) => {
    // @NOTICE deprecated to be removed next
    return new PROMISE(fn, reject);
  }
};

/**
 * Camelize a hyphen-delmited string.
 */
const camelCaseRE = /[-_](\w)/g;
function camelCase(str) {
  return lcfirst(str.replace(camelCaseRE, (_, c) => c ? c.toUpperCase() : ''));
}

/**
 * UnCapitalize a string.
 */
function lcfirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function parseHeaders(str, camelHeaders) {
  let ret = {};
  str.trim().split('\n').forEach(function (key) {
    key = key.replace(/\r/g, '');
    let arr = key.split(': ');
    let name = arr.shift().toLowerCase();
    ret[camelHeaders ? camelCase(name) : name] = arr.shift();
  });
  return ret;
}

function handleResolve(ret) {
  let it = this.nexts.shift();
  if (it) {
    let { resolve, reject } = it;
    if (resolve) {
      this.next = this.next.then(resolve, reject).catch(handleReject.bind(this)).then(handleResolve.bind(this));
    }
  } else {
    if (this.onFinally) {
      this.nexts = [];
      this.onFinally();
    }
  }
}

function handleReject(err) {
  this.error = err;
  if (this.onFinally) {
    this.nexts = [];
    this.onFinally(this.error);
  }
}

const tmpl = (() => {
  let tmplEncodeReg = /[<>&"'\x00]/g;
  let tmplEncodeMap = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;'
  };

  function compile(str) {
    return str.replace(/([\s'\\])(?![^%]*%\})|(?:\{%(=|#)([\s\S]+?)%\})|(\{%)|(%\})/g, function (s, p1, p2, p3, p4, p5) {
      if (p1) {
        // whitespace, quote and backspace in interpolation context
        return {
          '\n': '\\n',
          '\r': '\\r',
          '\t': '\\t',
          ' ': ' '
        }[s] || '\\' + s;
      }
      if (p2) {
        // interpolation: {%=prop%}, or unescaped: {%#prop%}
        if (p2 === '=') {
          return "'\r\n+slash(" + p3 + ")+'";
        }
        return "'\r\n+(" + p3 + ")+'";
      }
      if (p4) {
        // evaluation start tag: {%
        return "';\r\n";
      }
      if (p5) {
        // evaluation end tag: %}
        return "\r\n_tmp_+='";
      }
    });
  }

  function slash(s) {
    return String(s || '').replace(tmplEncodeReg, c => tmplEncodeMap[c] || '');
  }

  let Func = Function;

  return str => {
    let func = new Func('state, slash', "let _tmp_=''; {_tmp_='" + compile(str || '') + "';}\r\n return _tmp_");
    return state => func(state, slash);
  };
})();

// https://github.com/SheetJS/js-crc32
const crc32 = (() => {
  const poly = -306674912;
  const table = (() => {
    let c = 0;
    let table = new Array(256);
    for (let n = 0; n !== 256; ++n) {
      c = n;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      c = c & 1 ? poly ^ c >>> 1 : c >>> 1;
      table[n] = c;
    }
    return table;
  })();

  return (str, seed) => {
    let C = seed ^ -1;
    for (let i = 0, L = str.length, c, d; i < L;) {
      c = str.charCodeAt(i++);
      if (c < 0x80) {
        C = C >>> 8 ^ table[(C ^ c) & 0xFF];
      } else if (c < 0x800) {
        C = C >>> 8 ^ table[(C ^ (192 | c >> 6 & 31)) & 0xFF];
        C = C >>> 8 ^ table[(C ^ (128 | c & 63)) & 0xFF];
      } else if (c >= 0xD800 && c < 0xE000) {
        c = (c & 1023) + 64;
        d = str.charCodeAt(i++) & 1023;
        C = C >>> 8 ^ table[(C ^ (240 | c >> 8 & 7)) & 0xFF];
        C = C >>> 8 ^ table[(C ^ (128 | c >> 2 & 63)) & 0xFF];
        C = C >>> 8 ^ table[(C ^ (128 | d >> 6 & 15 | (c & 3) << 4)) & 0xFF];
        C = C >>> 8 ^ table[(C ^ (128 | d & 63)) & 0xFF];
      } else {
        C = C >>> 8 ^ table[(C ^ (224 | c >> 12 & 15)) & 0xFF];
        C = C >>> 8 ^ table[(C ^ (128 | c >> 6 & 63)) & 0xFF];
        C = C >>> 8 ^ table[(C ^ (128 | c & 63)) & 0xFF];
      }
    }
    return C ^ -1;
  };
})();

/**
 * jQuery MD5 hash algorithm function
 *
 *  <code>
 *    Calculate the md5 hash of a String
 *    String $.md5 ( String str )
 *  </code>
 *
 * Calculates the MD5 hash of str using the » RSA Data Security, Inc. MD5 Message-Digest Algorithm, and returns that hash.
 * MD5 (Message-Digest algorithm 5) is a widely-used cryptographic hash function with a 128-bit hash value. MD5 has been employed in a wide variety of security applications, and is also commonly used to check the integrity of data. The generated hash is also non-reversable. Data cannot be retrieved from the message digest, the digest uniquely identifies the data.
 * MD5 was developed by Professor Ronald L. Rivest in 1994. Its 128 bit (16 byte) message digest makes it a faster implementation than SHA-1.
 * This script is used to process a variable length message into a fixed-length output of 128 bits using the MD5 algorithm. It is fully compatible with UTF-8 encoding. It is very useful when u want to transfer encrypted passwords over the internet. If you plan using UTF-8 encoding in your project don't forget to set the page encoding to UTF-8 (Content-Type meta tag).
 * This function orginally get from the WebToolkit and rewrite for using as the jQuery plugin.
 *
 * Example
 *  Code
 *    <code>
 *      $.md5("I'm Persian.");
 *    </code>
 *  Result
 *    <code>
 *      "b8c901d0f02223f9761016cfff9d68df"
 *    </code>
 *
 * @alias Muhammad Hussein Fattahizadeh < muhammad [AT] semnanweb [DOT] com >
 * @link http://www.semnanweb.com/jquery-plugin/md5.html
 * @see http://www.webtoolkit.info/
 * @license http://www.gnu.org/licenses/gpl.html [GNU General Public License]
 * @param {jQuery} {md5:function(string))
 * @return string
 */

const md5 = (() => {
  function rotateLeft(lValue, iShiftBits) {
    return lValue << iShiftBits | lValue >>> 32 - iShiftBits;
  }

  function addUnsigned(lX, lY) {
    let lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function F(x, y, z) {
    return x & y | ~x & z;
  }

  function G(x, y, z) {
    return x & z | y & ~z;
  }

  function H(x, y, z) {
    return x ^ y ^ z;
  }

  function I(x, y, z) {
    return y ^ (x | ~z);
  }

  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(string) {
    let lWordCount;
    let lMessageLength = string.length;
    let lNumberOfWordsTempOne = lMessageLength + 8;
    let lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - lNumberOfWordsTempOne % 64) / 64;
    let lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16;
    let lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - lByteCount % 4) / 4;
      lBytePosition = lByteCount % 4 * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | string.charCodeAt(lByteCount) << lBytePosition;
      lByteCount++;
    }
    lWordCount = (lByteCount - lByteCount % 4) / 4;
    lBytePosition = lByteCount % 4 * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | 0x80 << lBytePosition;
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function WordToHex(lValue) {
    let WordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      let WordToHexValueTemp = '0' + (lValue >>> lCount * 8 & 255).toString(16);
      WordToHexValue += WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2);
    }
    return WordToHexValue;
  }

  function UTF8Encode(string) {
    string = string.replace(/\x0d\x0a/g, '\x0a');
    let output = '';
    for (let n = 0; n < string.length; n++) {
      let c = string.charCodeAt(n);
      if (c < 128) {
        output += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        output += String.fromCharCode(c >> 6 | 192);
        output += String.fromCharCode(c & 63 | 128);
      } else {
        output += String.fromCharCode(c >> 12 | 224);
        output += String.fromCharCode(c >> 6 & 63 | 128);
        output += String.fromCharCode(c & 63 | 128);
      }
    }
    return output;
  }

  const S11 = 7;
  const S12 = 12;
  const S13 = 17;
  const S14 = 22;
  const S21 = 5;
  const S22 = 9;
  const S23 = 14;
  const S24 = 20;
  const S31 = 4;
  const S32 = 11;
  const S33 = 16;
  const S34 = 23;
  const S41 = 6;
  const S42 = 10;
  const S43 = 15;
  const S44 = 21;
  return string => {
    let x = [];
    let k;
    let AA;
    let BB;
    let CC;
    let DD;
    let a;
    let b;
    let c;
    let d;
    string = UTF8Encode(string);
    x = convertToWordArray(string);
    a = 0x67452301;b = 0xEFCDAB89;c = 0x98BADCFE;d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
      AA = a;BB = b;CC = c;DD = d;
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }
    let tempValue = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
    return tempValue.toLowerCase();
  };
})();

function Flux(opts = { strict: true }) {
  let flux = this;
  let prop$$1 = initProp(flux);
  prop$$1('flux', flux);
  prop$$1('prop', prop$$1);
  prop$$1('mutations', {});
  prop$$1('actions', {});
  prop$$1('proxys', {});
  prop$$1('opts', opts);
  initUse(flux)([initUtil, bindEvent, initPromise, initCloneThen, initState, initCommit, initDispatch, initProxy, initDeclare]);
}

function initProp(flux) {
  let prop$$1 = (key, value, opts = {}) => {
    opts.value = value;
    Object.defineProperty(flux, key, opts);
  };
  prop$$1.get = (key, value, opts = {}) => {
    opts.get = value;
    Object.defineProperty(flux, key, opts);
  };
  return prop$$1;
}

function initUse({ flux, prop: prop$$1 }) {
  let use = (plugin, opts) => {
    if (Array.isArray(plugin)) {
      return plugin.forEach(plugin => {
        flux.use(plugin, opts);
      });
    }
    plugin(flux, opts);
  };
  prop$$1('use', use);
  return use;
}

function initUtil({ prop: prop$$1, opts }) {
  prop$$1('clone', clone);
  prop$$1('extend', extend);
  prop$$1('opt', (name, defaultVal = null) => {
    return name in opts ? opts[name] : defaultVal;
  });
}

function initState({ prop: prop$$1, emit, cloneThen, clone: clone$$1, resolve }) {
  let state = {};
  prop$$1.get('state', () => state, {
    set() {
      throw new Error('[flux] Use flux.replaceState() to explicit replace store state.');
    }
  });
  prop$$1('getState', () => clone$$1(state));

  prop$$1('replaceState', newState => {
    let stateStr = JSON.stringify(newState);
    newState = JSON.parse(stateStr);
    for (let x in state) {
      delete state[x];
    }
    for (let x in newState) {
      state[x] = newState[x];
    }
    return Promise.resolve(JSON.parse(stateStr)).then(cloneState => {
      emit('replace', cloneState);
      return cloneState;
    });
  });

  prop$$1('updateState', (changedState, slice) => {
    if (typeof changedState !== 'object') {
      throw new Error('[flux] updateState require new state as object');
    }
    if (changedState !== state) {
      Object.keys(changedState).map(key => {
        state[key] = changedState[key];
      });
    }
    if (!slice) {
      return cloneThen(changedState).then(cloneState => {
        emit('update', cloneState);
        return cloneState;
      });
    }
    return resolve();
  });
}

function initCommit({ prop: prop$$1, flux, updateState, resolve }) {
  let commit = (type, payload, fetch) => {
    let { mutations } = flux;
    if (typeof type === 'object') {
      payload = type;
      type = type.type;
    }
    let entry = mutations[type];
    if (!entry) {
      throw new Error('[flux] unknown mutation : ' + type);
    }
    let state = flux.state;
    let ret = entry(flux, payload, fetch);
    let update = ret => {
      if (ret) {
        if (ret === state) {
          throw new Error('[flux] commit require new object rather than old state');
        }
        if (typeof ret !== 'object') {
          throw new Error('[flux] commit require new object');
        }
        return updateState(ret);
      }
      return resolve();
    };
    if (isPromiseLike(ret)) {
      return ret.then(update);
    } else {
      return update(ret);
    }
  };
  prop$$1('commit', flux.opts.noProxy ? commit : proxyApi(commit));
}

function initDispatch({ prop: prop$$1, flux, commit, resolve, reject, opts, cloneThen }) {
  let dispatch = (action, payload, fetch) => {
    let { actions, mutations, proxys } = flux;
    let entry = action in actions && actions[action] || action in mutations && function (_, payload, fetch) {
      return commit(action, payload, fetch);
    };
    if (!entry && proxys[action]) {
      entry = proxys[action];
    }
    if (!entry) {
      return reject('[flux] unknown action : ' + action);
    }
    let err, ret;
    try {
      ret = entry(flux, payload, fetch);
    } catch (e) {
      err = e;
    }
    if (err) {
      return reject(err);
    }
    if (!isPromiseLike(ret)) {
      ret = resolve(ret);
    }
    if (fetch) {
      return ret;
    }
    // make copy
    return opts.strict ? ret.then(data => {
      if (Array.isArray(data) || typeof data === 'object' && data !== null) {
        if (data.__clone) {
          return resolve(data);
        }
        return cloneThen(data).then(newData => {
          Object.defineProperty(newData, '__clone', { value: true });
          return resolve(newData);
        });
      }
      return resolve(data);
    }) : ret;
  };
  prop$$1('dispatch', flux.opts.noProxy ? dispatch : proxyApi(dispatch));
}

function initProxy({ prop: prop$$1, proxys }) {
  prop$$1('proxy', (name, value) => {
    if (typeof name === 'object') {
      // batch mode
      for (let x in name) {
        if (value === null) {
          delete proxys[x];
        } else {
          proxys[x] = name[x];
        }
      }
    } else {
      // once mode
      if (value === null) {
        delete proxys[name];
      } else {
        proxys[name] = value;
      }
    }
  });
}

function initDeclare({ prop: prop$$1, flux, emit, commit, dispatch, updateState }) {
  let declare = mod => {
    if (!mod) {
      return;
    }
    if (Array.isArray(mod)) {
      return mod.forEach(declare);
    }
    if (mod.mutations) {
      for (let mutation in mod.mutations) {
        if (flux.mutations[mutation]) {
          throw new Error(`[flux] mutation exists: ${mutation}`);
        }
        flux.mutations[mutation] = mod.mutations[mutation];
        if (flux.opts.noProxy || !probe.Proxy) {
          proxyFunction(commit, mutation);
          proxyFunction(dispatch, mutation);
        }
      }
    }
    if (mod.proxys) {
      for (let action in mod.proxys) {
        flux.proxys[action] = mod.proxys[action];
      }
    }
    if (mod.actions) {
      for (let action in mod.actions) {
        if (flux.actions[action]) {
          throw new Error(`[flux] action exists: ${action}`);
        }
        flux.actions[action] = mod.actions[action];
        if (flux.opts.noProxy || !probe.Proxy) {
          proxyFunction(dispatch, action);
        }
      }
    }
    if (mod.state) {
      let states = flux.state;
      for (let state in mod.state) {
        if (state in states) {
          throw new Error(`[flux] state exists: ${state}`);
        }
      }
      updateState(mod.state, true);
    }
    emit('declare', mod);
  };
  prop$$1('declare', declare);
}

function proxyFunction(target, name) {
  target[name] = payload => {
    return target(name, payload);
  };
}

function proxyApi(entry) {
  if (probe.Proxy) {
    return new Proxy(entry, {
      get(target, name) {
        if (name === 'bind') {
          // @NOTE vue 2.5 使用了bind
          return () => entry;
        }
        return (payload, fetch) => {
          return entry(name, payload, fetch);
        };
      }
    });
  }
  return entry;
}

function initPromise({ prop: prop$$1 }) {
  let PROMISE = Promise;
  prop$$1('resolve', PROMISE.resolve.bind(PROMISE));
  prop$$1('reject', PROMISE.reject.bind(PROMISE));
  prop$$1('all', PROMISE.all.bind(PROMISE));
  prop$$1('then', fn => {
    return new PROMISE(fn);
  });
}

function initCloneThen({ prop: prop$$1, clone: clone$$1, resolve, then }) {
  if (!probe.MessageChannel) {
    prop$$1('cloneThen', value => {
      return resolve().then(() => resolve(clone$$1(value)));
    });
    return;
  }
  /* global MessageChannel */
  const channel = new MessageChannel();
  let maps = {};
  let idx = 0;
  let port2 = channel.port2;
  port2.start();
  port2.onmessage = ({ data: { key, value } }) => {
    const resolve = maps[key];
    resolve(value);
    delete maps[key];
  };
  prop$$1('cloneThen', value => {
    return new Promise(resolve => {
      const key = idx++;
      maps[key] = resolve;
      try {
        channel.port1.postMessage({ key, value });
      } catch (err) {
        console.error('cloneThen.postMessage', err);
        delete maps[key];
        try {
          value = JSON.parse(JSON.stringify(value));
        } catch (err) {
          console.error('cloneThen.JSON', err);
          value = clone$$1(value);
        }
        return then(() => resolve(value));
      }
    });
  });
}

function normalizeMap(map) {
  return Array.isArray(map) ? map.map(key => {
    return {
      key: key,
      val: key
    };
  }) : Object.keys(map).map(key => {
    return {
      key: key,
      val: map[key]
    };
  });
}

// 深度比较复制
function testAndUpdateDepth(oldState, newState, isVueRoot, Vue$$1) {
  Object.keys(newState).forEach(name => {
    if (!(name in oldState)) {
      // 新加入的属性
      return Vue$$1.set(oldState, name, newState[name]);
    }
    // 旧的比较赋值
    const newValue = newState[name];
    const oldValue = oldState[name];

    if (isObject(newValue)) {
      if (!isObject(oldValue)) {
        // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        Vue$$1.delete(oldState, name);
        Vue$$1.set(oldState, name, newValue);
      } else {
        // 继续深度比较赋值
        testAndUpdateDepth(oldState[name], newValue, false, Vue$$1);
      }
    } else if (isArray(newValue)) {
      if (!isArray(oldValue)) {
        // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        Vue$$1.delete(oldState, name);
        Vue$$1.set(oldState, name, newValue);

        // @todo 需要先删除
        // delete oldState[name]
        // const ob = oldState.__ob__
        // defineReactive(ob.value, name, newValue)
        // if (isVueRoot && ob) { // 必须再通知一下
        //   ob.dep.notify()
        // }
      } else {
        testAndUpdateArray(oldValue, newValue, Vue$$1);
      }
    } else {
      // 简单类型
      if (oldState[name] !== newState[name]) {
        oldState[name] = newState[name];
      }
    }
  });
}

function testAndUpdateArray(oldValue, newValue, Vue$$1) {
  const oldLen = oldValue.length;
  const newLen = newValue.length;

  if (oldLen > newLen) {
    // 多了删掉
    oldValue.splice(newLen, oldLen);
  } else if (oldLen < newLen) {
    // 少了补上
    while (oldValue.length < newLen) {
      oldValue.push(null);
    }
  }
  newValue.forEach((it, id) => {
    if (isObject(it)) {
      if (!isObject(oldValue[id])) {
        // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it);
      } else {
        // 复制对象
        testAndUpdateDepth(oldValue[id], it, false, Vue$$1);
      }
    } else if (isArray(it)) {
      if (!isArray(oldValue[id])) {
        // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it);
      } else {
        testAndUpdateArray(oldValue[id], it, Vue$$1);
      }
    } else {
      // 简单类型 直接赋值
      if (it !== oldValue[id]) {
        oldValue.splice(id, 1, it);
      }
    }
  });
}

function resetStoreVM(Vue$$1, flux, vaf, state) {
  let oldVm = vaf.vm;
  if (oldVm) {
    flux.off('update', vaf.watch);
  }
  const silent = Vue$$1.config.silent;
  Vue$$1.config.silent = true;
  let vm = vaf.vm = new Vue$$1({ data: { state } });
  flux.on('update', vaf.watch = newState => {
    if (vaf.deepCopy) {
      return testAndUpdateDepth(vm.state, newState, true, Vue$$1);
    }
    if (isVmGetterMode) {
      let updates = [];
      for (let key in newState) {
        if (key in vm.state) {
          vm.state[key] = newState[key];
        } else {
          // dynamic computed methods
          Vue$$1.util.defineReactive(vm.state, key, newState[key]);
          if (vmGetterMaps[key]) {
            vmGetterMaps[key].forEach(vmIt => {
              if (vmIt._computedWatchers && vmIt._computedWatchers[key]) {
                updates.indexOf(vmIt) === -1 && updates.push(vmIt);
                vmIt._computedWatchers[key].update();
              }
            });
          }
        }
      }
      updates.forEach(vm => vm.$forceUpdate());
    } else {
      // old version use mapGetters
      for (let key in newState) {
        vm.state[key] = newState[key];
      }
    }
  });
  Vue$$1.config.silent = silent;
  if (oldVm) {
    oldVm.state = null;
    Vue$$1.nextTick(() => oldVm.$destroy());
  }
}

let Vue$1;

function FluxVue({ flux, mixinActions = false, injects = [], router, onRouteFail, payload, deepth = -1, deepCopy = false }) {
  let vaf = {
    deepCopy,
    dispatch: flux.dispatch,
    proxy: flux.proxy,
    subscribe: flux.subscribe
  };
  injects.forEach(key => {
    vaf[key] = flux[key];
  });
  resetStoreVM(Vue$1, flux, vaf, flux.getState());
  flux.on('replace', state => {
    resetStoreVM(Vue$1, flux, vaf, state);
  });
  if (mixinActions) {
    Vue$1.mixin({
      methods: mapActions(unique(Object.keys(flux.mutations).concat(Object.keys(flux.actions))))
    });
  }
  Vue$1.mixin({
    methods: {
      dispatch: flux.dispatch,
      updateState: flux.updateState,
      commit: flux.commit
    }
  });
  return vaf;
}

let vmGetterMaps = {};
let isVmGetterMode = false;

function registerVmGetters(vm, getters) {
  isVmGetterMode || (isVmGetterMode = true);
  getters = vm._getters = Object.keys(getters);
  getters.forEach(key => {
    let arr = vmGetterMaps[key] || (vmGetterMaps[key] = []);
    arr.push(vm);
  });
}

function destroyVmGetters(vm) {
  if (vm._getters) {
    vm._getters.forEach(key => {
      if (vmGetterMaps[key]) {
        let arr = vmGetterMaps[key];
        let pos = arr.indexOf(vm);
        if (pos >= -1) {
          arr.splice(pos, 1);
        }
      }
    });
  }
}

FluxVue.install = function install(vue) {
  Vue$1 = vue;
  let delegate = (vm, events) => {
    let vmEvent = vm.$flux;
    let reverse = events.map(it => vmEvent.subscribe(it, (...args) => {
      vm[it](...args);
    }));
    return () => {
      reverse.forEach(it => it());
      delete vm.$unsubscribe;
    };
  };

  Vue$1.mixin({
    beforeCreate() {
      const options = this.$options;
      if (options.vaf) {
        this.$flux = options.vaf;
      } else if (options.parent && options.parent.$flux) {
        this.$flux = options.parent.$flux;
      }
      let { proxys, methods, actions, getters, computed, subscribes } = options;
      if (this.$flux) {
        if (subscribes || actions) {
          methods || (methods = this.$options.methods = {});
        }
        if (subscribes) {
          if (!Array.isArray(subscribes)) {
            // object
            Object.assign(methods, subscribes);
            subscribes = Object.keys(subscribes);
          }
          this.$unsubscribe = delegate(this, subscribes);
        }

        if (actions) {
          Object.assign(methods, mapActions(actions));
        }
        if (getters) {
          computed || (computed = options.computed = {});
          let getterMaps = mapGetters(getters);
          registerVmGetters(this, getterMaps);
          Object.assign(computed, getterMaps);
        }
        if (proxys) {
          let maps = this.__vafMaps = {};
          Object.keys(proxys).map(key => {
            maps[key] = (typeof proxys[key] === 'function' ? proxys[key] : methods[proxys[key]]).bind(this);
          });
          this.$flux.proxy(maps);
        }
      }
    },
    beforeDestroy() {
      const options = this.$options;
      let { proxys } = options;
      if (proxys && this.$flux && this.__vafMaps) {
        this.$flux.proxy(this.__vafMaps, null);
      }
      if (isVmGetterMode) {
        destroyVmGetters(this);
      }
      if (this.$unsubscribe) {
        this.$unsubscribe();
      }
      if (this.$flux) {
        delete this.$flux;
      }
    }
  });
};

// 后续不建议使用
function mapGetters(getters) {
  let res = {};
  normalizeMap(getters).forEach(function (ref) {
    let key = ref.key;
    let val = ref.val;
    res[key] = isFunction(val) ? function mappedGetter() {
      // function(state){}
      return val.call(this, this.$flux.vm.state);
    } : function mappedGetter() {
      return this.$flux.vm.state[val];
    };
  });
  return res;
}

function mapActions(actions) {
  let res = {};
  normalizeMap(actions).forEach(ref => {
    let key = ref.key;
    let val = ref.val;
    res[key] = function mappedAction(payload, fetch) {
      if (!this.$flux) {
        let message = `can not call action ${key} without flux`;
        return Promise.reject(new Error(message));
      }
      return this.$flux.dispatch(val, payload, fetch);
    };
  });
  return res;
}

function syncState(keys, sync) {
  let ret = {};
  keys.forEach(key => {
    ret[key] = sync[key]();
  });
  return ret;
}

function syncBinder(binder) {
  if (binder.vms.length) {
    let state = syncState(binder.keys, binder.sync);
    binder.vms.forEach(vm => vm.update(state));
  }
}

function syncBinderKeys(binder, keys) {
  let state = syncState(keys.filter(key => binder.keys.indexOf(key) >= 0), binder.sync);
  binder.vms.forEach(vm => vm.update(state));
}

let _startIdx = 0;

var TodoModule = {
  state: {
    todoList: []
  },
  mutations: {
    createNew({ state: { todoList } }, newItem) {
      todoList.push(newItem);
      return { todoList };
    },
    toggleCompleted({ state: { todoList } }, todo) {
      for (let i = 0, l = todoList.length; i < l; ++i) {
        if (todoList[i].id == todo.id) {
          let it = todoList[i];
          if (it.isCompleted == todo.isCompleted) {
            it.isCompleted = !todo.isCompleted;
            return { todoList };
          }
        }
      }
    },
    removeItemById({ state: { todoList } }, id) {
      for (let i = todoList.length - 1; i >= 0; --i) {
        if (todoList[i].id == id) {
          todoList.splice(i, 1);
          return { todoList };
        }
      }
    },
    restoreItems(_, todoList) {
      if (!Array.isArray(todoList)) {
        todoList = [];
      }
      _startIdx = todoList.length;
      return {
        todoList
      };
    }
  },
  actions: {
    createNew({ resolve, commit, dispatch, emit }, title) {
      let newItem = {};
      newItem.title = title;
      newItem.id = ++_startIdx;
      newItem.isCompleted = false;
      emit('getTitle', title);
      commit.createNew(newItem);
      return dispatch.onCreateNew(newItem);
    }
  }
};

var Todo = { render: function () {
		var _vm = this;var _h = _vm.$createElement;var _c = _vm._self._c || _h;return _c('div', { staticClass: "todolist" }, [_c('h4', [_vm._v("TODO LIST"), _c('i', [_vm._v("(create times " + _vm._s(_vm.count) + ")")])]), _vm._v(" "), _c('ul', _vm._l(_vm.todoList, function (child) {
			return _c('li', [_c('label', [_c('input', { attrs: { "type": "checkbox" }, domProps: { "checked": child.isCompleted }, on: { "change": function ($event) {
						_vm.toggleCompleted(child);
					} } }), _vm._v(" "), _c('span', [_vm._v(_vm._s(child.title))])]), _vm._v(" "), _c('button', { on: { "click": function ($event) {
						_vm.removeItemById(child.id);
					} } }, [_vm._v("x")])]);
		})), _vm._v(" "), _c('input', { directives: [{ name: "model", rawName: "v-model", value: _vm.newText, expression: "newText" }], attrs: { "type": "text" }, domProps: { "value": _vm.newText }, on: { "input": function ($event) {
					if ($event.target.composing) {
						return;
					}_vm.newText = $event.target.value;
				} } }), _vm._v(" "), _c('button', { on: { "click": function ($event) {
					_vm.createNew(_vm.newText);
				} } }, [_vm._v("Add")])]);
	}, staticRenderFns: [],
	getters: ['todoList'],
	subscribes: {
		getTitle(arg) {
			console.log('broadcat', arg);
		}
	},
	data: function () {
		return {
			newText: '',
			count: 0
		};
	},
	payload(route, { dispatch }) {
		dispatch('restoreItems', [{
			title: 'payload-todo',
			id: 1,
			isCompleted: true
		}]);
	},
	proxys: {
		onCreateNew({ resolve }, item) {
			this.count++;
			return resolve('ok');
		}
	}
};

Vue.use(FluxVue);

let flux = new Flux({
  strict: true // enable this for promise action to resolve data copy
});
flux.declare(TodoModule);

let router = new VueRouter({
  routes: [{
    name: "Todo",
    path: "/",
    component: Todo
  }]
});

let app = new Vue({
  vaf: new FluxVue({
    flux,
    router,
    mixinActions: true
  }),
  router,
  el: '#app',
  mounted() {
    // this.$broadcast('check', 'helo12aaaa3')
  }
});

window.flux = flux;

return app;

}(Vue,VueRouter));
