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
  Object.defineProperty(target, key, { value, writable: true, configurable: true });
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

/**
 * ajax 方法
 * @param  {Object}   opts 请求对象
 * {
 *     method:"GET",
 *     dataType:"JSON",
 *     headers:{},
 *     url:"",
 *     data:{},
 * }
 * @param  {Function} next 回调
 * @return {XMLHttpRequest}        xhr对象
 */
function ajax(opts, next) {
  let method = (opts.method || 'GET').toUpperCase();
  let dataType = (opts.dataType || 'JSON').toUpperCase();
  let timeout = opts.timeout;
  /* global XMLHttpRequest */
  let req = new XMLHttpRequest();
  let data = null;
  let isPost = method === 'POST';
  let isGet = method === 'GET';
  let isFormData = false;
  let emit = function (err, data, headers) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    req.onload = req.onreadystatechange = req.onerror = null;
    if (next) {
      let tmp = next;
      next = null;
      tmp(err, data, headers);
    }
  };
  if (isGet) {
    if (opts.data) {
      let u = parseUrl(opts.url);
      let q = parseQuery(u.query);
      for (let x in opts.data) {
        q[x] = opts.data[x];
      }
      u.query = stringifyQuery(q);
      opts.url = stringifyUrl(u);
      opts.data = null;
    }
  } else if (isPost) {
    data = opts.data;
    /* global FormData */
    if (probe.FormData) {
      isFormData = data instanceof FormData;
      if (!isFormData) {
        data = stringifyQuery(data);
      }
    }
  }
  if (timeout) {
    timeout = setTimeout(function () {
      req.abort();
      emit(new Error('error_timeout'));
    }, timeout);
  }
  try {
    opts.xhr && opts.xhr(req);
    if (dataType === 'BINARY') {
      req.responseType = 'arraybuffer';
    }
    req.open(method, opts.url, true);
    if (opts.headers) {
      for (let x in opts.headers) {
        req.setRequestHeader(x, opts.headers[x]);
      }
    }
    if (isPost && !isFormData) {
      req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    if (opts.headerOnly) {
      req.onreadystatechange = function () {
        // console.log('state', req.readyState, req);
        if (req.readyState === 2) {
          // HEADERS_RECEIVED
          let headers = parseHeaders(req.getAllResponseHeaders(), opts.camelHeaders);
          req.abort();
          emit(null, undefined, headers);
        }
      };
    }
    req.onload = function () {
      // if(req.readyState != 4) return;
      if ([200, 304, 206, 0].indexOf(req.status) === -1) {
        // error
        emit(new Error('error_status_' + req.status));
      } else {
        let data = req.response;
        try {
          if (dataType === 'JSON') {
            data = JSON.parse(req.responseText);
          } else if (dataType === 'XML') {
            data = req.responseXML;
          } else if (dataType === 'TEXT') {
            data = req.responseText;
          } else if (dataType === 'BINARY') {
            let arrayBuffer = new Uint8Array(data);
            let str = '';
            for (let i = 0; i < arrayBuffer.length; i++) {
              str += String.fromCharCode(arrayBuffer[i]);
            }
            data = str;
          }
        } catch (err) {
          return emit(err);
        }
        emit(null, data, parseHeaders(req.getAllResponseHeaders(), opts.camelHeaders));
      }
    };
    req.onerror = function (e) {
      emit(new Error('error_network'));
    };
    // 进度
    if (opts.onprogress && !opts.headerOnly) {
      req.onloadend = req.onprogress = function (e) {
        let info = {
          total: e.total,
          loaded: e.loaded,
          percent: e.total ? Math.trunc(100 * e.loaded / e.total) : 0
        };
        if (e.type === 'loadend') {
          info.percent = 100;
        } else if (e.total === e.loaded) {
          return;
        }
        if (e.total < e.loaded) {
          info.total = info.loaded;
        }
        if (info.percent === 0) {
          return;
        }
        opts.onprogress(info);
      };
    }
    req.send(data);
  } catch (e) {
    emit(e);
  }
  return req;
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

function compose(middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(context, function next() {
          return dispatch(i + 1);
        }));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

class Request {
  constructor(opts) {
    this.opts = {
      baseUrl: '/',
      stripHeaders: true, // 不返回头部信息
      handleError: false, // 捕获异常, emit('error')
      ajax
    };
    this.invokeQueues = [this.invoke.bind(this)];
    this.invoker = null;
    bindEvent(this);
    if (opts) {
      this.setOptions(opts);
    }
  }
  setOptions(opts) {
    this.opts = Object.assign({}, this.opts, { opts });
  }
  before(fn) {
    this.invoker = null;
    this.invokeQueues.unshift(fn);
  }
  after(fn) {
    this.invoker = null;
    this.invokeQueues.push(fn);
  }
  get(url, options) {
    return this.request(Object.assign({ method: 'GET', url }, options));
  }
  post(url, options) {
    return this.request(Object.assign({ method: 'POST', url }, options));
  }
  put(url, options) {
    return this.request(Object.assign({ method: 'PUT', url }, options));
  }
  patch(url, options) {
    return this.request(Object.assign({ method: 'PATCH', url }, options));
  }
  del(url, options) {
    return this.request(Object.assign({ method: 'DELETE', url }, options));
  }
  request(options) {
    options = Object.assign({
      url: '',
      headers: {}
    }, options);
    if (!/^(http(s?):)?\/\//i.test(options.url)) {
      options.url = this.opts.baseUrl + options.url;
    }
    if (!this.invoker) {
      this.invoker = compose(this.invokeQueues);
    }
    let { invoker } = this;
    let { stripHeaders, handleError } = this.opts;
    let ctx = { request: options };
    let res = invoker(ctx);
    if (stripHeaders) {
      res = res.then(() => ctx.data);
    }
    if (handleError) {
      return res.catch(err => {
        this.emit('error', err);
      });
    }
    return res;
  }
  invoke(ctx, next$$1) {
    return new Promise((resolve, reject) => {
      ctx.xhr = ajax(ctx.request, (err, data, headers) => {
        if (err) {
          return reject(err);
        }
        try {
          ctx.response = {
            data,
            headers
          };
          this.emit('response', ctx);
        } catch (err) {
          return reject(err);
        }
        resolve();
      });
      this.emit('request', ctx);
    }).then(next$$1);
  }
}

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
  prop$$1('request', new Request());
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
  let commit = (type, payload) => {
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
    let ret = entry(flux, payload);
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
  let dispatch = (action, payload) => {
    let { actions, mutations, proxys } = flux;
    let entry = action in actions && actions[action] || action in mutations && function (_, payload) {
      return commit(action, payload);
    };
    if (!entry && proxys[action]) {
      entry = proxys[action];
    }
    if (!entry) {
      return reject('[flux] unknown action : ' + action);
    }
    let err, ret;
    try {
      ret = entry(flux, payload);
    } catch (e) {
      err = e;
    }
    if (err) {
      return reject(err);
    }
    if (!isPromiseLike(ret)) {
      ret = resolve(ret);
    }
    // make copy
    return opts.strict ? ret.then(data => {
      if (Array.isArray(data) || typeof data === 'object') {
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
        return payload => {
          return entry(name, payload);
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
    proxy: flux.proxy
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
      dispatch(method, payload) {
        return vaf.dispatch(method, payload);
      }
    }
  });
  if (router) {
    router.beforeEach((to, from, next$$1) => {
      let matchedComponents = router.getMatchedComponents(to);
      if (matchedComponents.length) {
        let args = {
          dispatch: vaf.dispatch,
          route: to,
          from: from,
          state: vaf.vm.state
        };
        Promise.all(getComponentsPayloads(matchedComponents, deepth).map(Component => {
          if (payload) {
            return payload(Component, args, to, from);
          }
          return Component.payload(args);
        })).then(next$$1).catch(err => {
          if (!(err instanceof Error)) {
            return next$$1(err);
          }
          if (onRouteFail) {
            return onRouteFail(to, from, next$$1, err);
          } else {
            next$$1(false);
          }
        });
      } else {
        next$$1();
      }
    });
  }
  return vaf;
}

function getComponentsPayloads(components, depth) {
  let payloads = [];
  if (Array.isArray(components)) {
    for (let i = 0; i < components.length; ++i) {
      let com = components[i];
      if (com.payload) {
        payloads.push(com);
      }
      if (depth && com.components) {
        payloads = payloads.concat(getComponentsPayloads(com.components, depth--));
      }
    }
  } else {
    for (let comName in components) {
      let com = components[comName];
      if (com.payload) {
        payloads.push(com);
      }
      if (depth && com.components) {
        payloads = payloads.concat(getComponentsPayloads(com.components, depth--));
      }
    }
  }
  return payloads;
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
  Vue$1.mixin({
    beforeCreate() {
      const options = this.$options;
      if (options.vaf) {
        this.$flux = options.vaf;
      } else if (options.parent && options.parent.$flux) {
        this.$flux = options.parent.$flux;
      }
      let { proxys, methods, actions, getters, computed } = options;
      if (this.$flux) {
        if (actions) {
          methods || (methods = options.methods = {});
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
    res[key] = function mappedAction(payload) {
      if (!this.$flux) {
        let message = `can not call action ${key} without flux`;
        return Promise.reject(new Error(message));
      }
      return this.$flux.dispatch(val, payload);
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
    createNew({ resolve, commit, dispatch }, title) {
      let newItem = {};
      newItem.title = title;
      newItem.id = ++_startIdx;
      newItem.isCompleted = false;
      commit.createNew(newItem);
      return dispatch.onCreateNew(newItem);
    }
  }
};

var Todo = { render: function () {
		var _vm = this;var _h = _vm.$createElement;var _c = _vm._self._c || _h;return _c('div', { staticClass: "todolist" }, [_c('h4', [_vm._v("TODO LIST"), _c('i', [_vm._v("(create times " + _vm._s(_vm.count) + ")")])]), _c('ul', _vm._l(_vm.todoList, function (child) {
			return _c('li', [_c('label', [_c('input', { attrs: { "type": "checkbox" }, domProps: { "checked": child.isCompleted }, on: { "change": function ($event) {
						_vm.toggleCompleted(child);
					} } }), _vm._v(" "), _c('span', [_vm._v(_vm._s(child.title))])]), _c('button', { on: { "click": function ($event) {
						_vm.removeItemById(child.id);
					} } }, [_vm._v("x")])]);
		})), _c('input', { directives: [{ name: "model", rawName: "v-model", value: _vm.newText, expression: "newText" }], attrs: { "type": "text" }, domProps: { "value": _vm.newText }, on: { "input": function ($event) {
					if ($event.target.composing) {
						return;
					}_vm.newText = $event.target.value;
				} } }), _vm._v(" "), _c('button', { on: { "click": function ($event) {
					_vm.createNew(_vm.newText);
				} } }, [_vm._v("Add")])]);
	}, staticRenderFns: [],
	getters: ['todoList'],
	data: function () {
		return {
			newText: '',
			count: 0
		};
	},
	payload({ dispatch }) {
		return dispatch('restoreItems', [{
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
  el: '#app'
});

window.flux = flux;

return app;

}(Vue,VueRouter));
