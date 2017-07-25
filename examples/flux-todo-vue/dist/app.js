var app = (function (Vue,VueRouter) {
Vue = 'default' in Vue ? Vue['default'] : Vue;
VueRouter = 'default' in VueRouter ? VueRouter['default'] : VueRouter;

function toStringType(val) {
  return Object.prototype.toString.call(val).slice(8, -1);
}

var isArray = Array.isArray;

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

var probe = {
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
var REKeys = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
var URL_RE = /^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#/]*\.[^?#/.]+(?:[?#]|$)))*\/?)?([^?#/]*))(?:\?([^#]*))?(?:#(.*))?)/;

function parseUrl(str) {
  var _uri = {};
  var _m = URL_RE.exec(str || '');
  var _i = REKeys.length;
  while (_i--) {
    _uri[REKeys[_i]] = _m[_i] || '';
  }
  return _uri;
}

function stringifyUrl(uri) {
  var str = '';
  if (uri) {
    if (uri.host) {
      if (uri.protocol) { str += uri.protocol + ':'; }
      str += '//';
      if (uri.user) { str += uri.user + ':'; }
      if (uri.password) { str += uri.password + '@'; }
      str += uri.host;
      if (uri.port) { str += ':' + uri.port; }
    }
    str += uri.path || '';
    if (uri.query) { str += '?' + uri.query; }
    if (uri.anchor) { str += '#' + uri.anchor; }
  }
  return str;
}

var _encode = encodeURIComponent;
var r20 = /%20/g;
var rbracket = /\[]$/;

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
    for (var name in obj) {
      buildParams(prefix + '[' + name + ']', obj[name], add);
    }
  } else {
    // Serialize scalar item.
    add(prefix, obj);
  }
}

// # http://stackoverflow.com/questions/1131630/the-param-inverse-function-in-javascript-jquery
// a[b]=1&a[c]=2&d[]=3&d[]=4&d[2][e]=5 <=> { a: { b: 1, c: 2 }, d: [ 3, 4, { e: 5 } ] }
function parseQuery(str, opts) {
  if ( opts === void 0 ) opts = {};

  var _querys = {};
  decodeURIComponent(str || '').replace(/\+/g, ' ')
  // (optional no-capturing & )(key)=(value)
  .replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, _name, _value) {
    if (_name) {
      var _path, _acc, _tmp, _ref;
      (_path = []).unshift(_name = _name.replace(/\[([^\]]*)]/g, function ($0, _k) {
        _path.push(_k);
        return '';
      }));
      _ref = _querys;
      for (var j = 0; j < _path.length - 1; j++) {
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
  var _add = function (key, value) {
    /* jshint eqnull:true */
    _str.push(_encode(key) + '=' + (value === null || value === undefined ? '' : _encode(value)));
    // _str.push(( key ) + "=" +  (value == null ? "" : ( value )));
  };
  var _str = [];
  query || (query = {});
  for (var x in query) {
    buildParams(x, query[x], _add);
  }
  return _str.join('&').replace(r20, '+');
}

function extend() {
  var arguments$1 = arguments;

  // form jQuery & remove this
  var options, name, src, copy, copyIsArray, clone;
  var target = arguments[0] || {};
  var i = 1;
  var length = arguments.length;
  var deep = false;
  if (isBoolean(target)) {
    deep = target;
    target = arguments[i] || {};
    i++;
  }
  if (typeof target !== 'object' && !isFunction(target)) {
    target = {};
  }
  for (; i < length; i++) {
    options = arguments$1[i];
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
  Object.defineProperty(target, key, { value: value, writable: true, configurable: true });
}

function makePropFunc(target, propName) {
  if (!target._props_) {
    prop(target, '_props_', ['_props_']);
  }
  var props = target._props_;
  return function (key, value) {
    if (isObject(key)) {
      for (var name in key) {
        var obj;
        Object.defineProperty(target, name, ( obj = { writable: true, configurable: true }, obj[("" + propName)] = key[name], obj ));
        props.push(name);
      }
    } else {
      var descriptor = { configurable: true };
      descriptor[("" + propName)] = value;
      if (propName === 'value') {
        descriptor.writable = true;
      }
      Object.defineProperty(target, key, descriptor);
      props.push(key);
    }
  };
}

function bindEvent(target) {
  var _events = {};
  prop(target, 'on', function (event, fn) {
    (_events[event] || (_events[event] = [])).push(fn);
  });

  prop(target, 'before', function (event, fn) {
    (_events[event] || (_events[event] = [])).unshift(fn);
  });

  prop(target, 'off', function (event, fn) {
    if (_events[event]) {
      var list = _events[event];
      if (fn) {
        var pos = list.indexOf(fn);
        if (pos !== -1) {
          list.splice(pos, 1);
        }
      } else {
        delete _events[event];
      }
    }
  });

  prop(target, 'once', function (event, fn) {
    var once = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      target.off(event, fn);
      fn.apply(void 0, args);
    };
    target.on(event, once);
  });

  prop(target, 'subscribe', function (event, fn) {
    target.on(event, fn);
    return function () {
      target.off(event, fn);
    };
  });

  prop(target, 'emit', function (event) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    if (_events[event]) {
      var list = _events[event].slice();
      var fn;
      while (fn = list.shift()) {
        fn.apply(void 0, args);
      }
    }
  });
}

function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }
  var len = arr.length;
  var i = -1;
  while (i++ < len) {
    var j = i + 1;
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

var PROMISE = Promise;
var promise = {
  resolve: PROMISE.resolve.bind(PROMISE),
  reject: PROMISE.reject.bind(PROMISE),
  all: PROMISE.all.bind(PROMISE),
  then: function (fn, reject) {
    // @NOTICE deprecated to be removed next
    return new PROMISE(fn, reject);
  }
};

/**
 * Camelize a hyphen-delmited string.
 */
var camelCaseRE = /[-_](\w)/g;
function camelCase(str) {
  return lcfirst(str.replace(camelCaseRE, function (_, c) { return c ? c.toUpperCase() : ''; }));
}

/**
 * UnCapitalize a string.
 */
function lcfirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function parseHeaders(str, camelHeaders) {
  var ret = {};
  str.trim().split('\n').forEach(function (key) {
    key = key.replace(/\r/g, '');
    var arr = key.split(': ');
    var name = arr.shift().toLowerCase();
    ret[camelHeaders ? camelCase(name) : name] = arr.shift();
  });
  return ret;
}

function Flux (opts) {
  if ( opts === void 0 ) opts = {strict: true};

  var flux = this;
  var prop$$1 = initProp(flux);
  prop$$1('flux', flux);
  prop$$1('prop', prop$$1);
  prop$$1('mutations', {});
  prop$$1('actions', {});
  prop$$1('proxys', {});
  prop$$1('opts', opts);
  initUse(flux)([initUtil, bindEvent, initPromise, initCloneThen,
    initState, initCommit, initDispatch, initProxy,
    initDeclare]);
}

function initProp (flux) {
  var prop$$1 = function (key, value, opts) {
    if ( opts === void 0 ) opts = {};

    opts.value = value;
    Object.defineProperty(flux, key, opts);
  };
  prop$$1.get = function (key, value, opts) {
    if ( opts === void 0 ) opts = {};

    opts.get = value;
    Object.defineProperty(flux, key, opts);
  };
  return prop$$1
}

function initUse (ref) {
  var flux = ref.flux;
  var prop$$1 = ref.prop;

  var use = function (plugin, opts) {
    if (Array.isArray(plugin)) {
      return plugin.forEach(function (plugin) {
        flux.use(plugin, opts);
      })
    }
    plugin(flux, opts);
  };
  prop$$1('use', use);
  return use
}

function initUtil (ref) {
  var prop$$1 = ref.prop;
  var opts = ref.opts;

  prop$$1('clone', clone);
  prop$$1('extend', extend);
  prop$$1('opt', function (name, defaultVal) {
    if ( defaultVal === void 0 ) defaultVal = null;

    return name in opts ? opts[name] : defaultVal
  });
}

function initState (ref) {
  var prop$$1 = ref.prop;
  var emit = ref.emit;
  var cloneThen = ref.cloneThen;
  var clone$$1 = ref.clone;
  var resolve = ref.resolve;

  var state = {};
  prop$$1.get('state', function () { return state; }, {
    set: function set () {
      throw new Error('[flux] Use flux.replaceState() to explicit replace store state.')
    }
  });
  prop$$1('getState', function () { return clone$$1(state); });

  prop$$1('replaceState', function (newState) {
    var stateStr = JSON.stringify(newState);
    newState = JSON.parse(stateStr);
    for (var x in state) {
      delete state[x];
    }
    for (var x$1 in newState) {
      state[x$1] = newState[x$1];
    }
    return Promise.resolve(JSON.parse(stateStr)).then(function (cloneState) {
      emit('replace', cloneState);
      return cloneState
    })
  });

  prop$$1('updateState', function (changedState, slice) {
    if (typeof changedState !== 'object') {
      throw new Error('[flux] updateState require new state as object')
    }
    if (changedState !== state) {
      Object.keys(changedState).map(function (key) {
        state[key] = changedState[key];
      });
    }
    if (!slice) {
      return cloneThen(changedState).then(function (cloneState) {
        emit('update', cloneState);
        return cloneState
      })
    }
    return resolve()
  });
}

function initCommit (ref) {
  var prop$$1 = ref.prop;
  var flux = ref.flux;
  var updateState = ref.updateState;
  var resolve = ref.resolve;

  var commit = function (type, payload) {
    var mutations = flux.mutations;
    if (typeof type === 'object') {
      payload = type;
      type = type.type;
    }
    var entry = mutations[type];
    if (!entry) {
      throw new Error('[flux] unknown mutation : ' + type)
    }
    var state = flux.state;
    var ret = entry(flux, payload);
    var update = function (ret) {
      if (ret) {
        if (ret === state) {
          throw new Error('[flux] commit require new object rather than old state')
        }
        if (typeof ret !== 'object') {
          throw new Error('[flux] commit require new object')
        }
        return updateState(ret)
      }
      return resolve()
    };
    if (isPromiseLike(ret)) {
      return ret.then(update)
    } else {
      return update(ret)
    }
  };
  prop$$1('commit', flux.opts.noProxy ? commit : proxyApi(commit));
}

function initDispatch (ref) {
  var prop$$1 = ref.prop;
  var flux = ref.flux;
  var commit = ref.commit;
  var resolve = ref.resolve;
  var reject = ref.reject;
  var opts = ref.opts;
  var cloneThen = ref.cloneThen;

  var dispatch = function (action, payload) {
    var actions = flux.actions;
    var mutations = flux.mutations;
    var proxys = flux.proxys;
    var entry = action in actions && actions[action] ||
      action in mutations && function (_, payload) {
        return commit(action, payload)
      };
    if (!entry && (proxys[action])) {
      entry = proxys[action];
    }
    if (!entry) {
      return reject('[flux] unknown action : ' + action)
    }
    var err, ret;
    try {
      ret = entry(flux, payload);
    } catch (e) {
      err = e;
    }
    if (err) {
      return reject(err)
    }
    if (!isPromiseLike(ret)) {
      ret = resolve(ret);
    }
        // make copy
    return opts.strict ? ret.then(function (data) {
      if (Array.isArray(data) || typeof data === 'object') {
        if (data.__clone) {
          return resolve(data)
        }
        return cloneThen(data).then(function (newData) {
          Object.defineProperty(newData, '__clone', {value: true});
          return resolve(newData)
        })
      }
      return resolve(data)
    }) : ret
  };
  prop$$1('dispatch', flux.opts.noProxy ? dispatch : proxyApi(dispatch));
}

function initProxy (ref) {
  var prop$$1 = ref.prop;
  var proxys = ref.proxys;

  prop$$1('proxy', function (name, value) {
    if (typeof name === 'object') { // batch mode
      for (var x in name) {
        if (value === null) {
          delete proxys[x];
        } else {
          proxys[x] = name[x];
        }
      }
    } else { // once mode
      if (value === null) {
        delete proxys[name];
      } else {
        proxys[name] = value;
      }
    }
  });
}

function initDeclare (ref) {
  var prop$$1 = ref.prop;
  var flux = ref.flux;
  var emit = ref.emit;
  var commit = ref.commit;
  var dispatch = ref.dispatch;
  var updateState = ref.updateState;

  var declare = function (mod) {
    if (!mod) {
      return
    }
    if (Array.isArray(mod)) {
      return mod.forEach(declare)
    }
    if (mod.mutations) {
      for (var mutation in mod.mutations) {
        if (flux.mutations[mutation]) {
          throw new Error(("[flux] mutation exists: " + mutation))
        }
        flux.mutations[mutation] = mod.mutations[mutation];
        if (flux.opts.noProxy || !probe.Proxy) {
          proxyFunction(commit, mutation);
          proxyFunction(dispatch, mutation);
        }
      }
    }
    // if (mod.proxys) {
    //   for(let action in mod.proxys) {
    //     flux.proxys[action] = mod.proxys[action]
    //   }
    // }
    if (mod.actions) {
      for (var action in mod.actions) {
        if (flux.actions[action]) {
          throw new Error(("[flux] action exists: " + action))
        }
        flux.actions[action] = mod.actions[action];
        if (flux.opts.noProxy || !probe.Proxy) {
          proxyFunction(dispatch, action);
        }
      }
    }
    if (mod.state) {
      var states = flux.state;
      for (var state in mod.state) {
        if (state in states) {
          throw new Error(("[flux] state exists: " + state))
        }
      }
      updateState(mod.state, true);
    }
    emit('declare', mod);
  };
  prop$$1('declare', declare);
}

function proxyFunction (target, name) {
  target[name] = function (payload) {
    return target(name, payload)
  };
}

function proxyApi (entry) {
  if (probe.Proxy) {
    return new Proxy(entry, {
      get: function get (target, name) {
        return function (payload) {
          return entry(name, payload)
        }
      }
    })
  }
  return entry
}

function initPromise (ref) {
  var prop$$1 = ref.prop;

  var PROMISE = Promise;
  prop$$1('resolve', PROMISE.resolve.bind(PROMISE));
  prop$$1('reject', PROMISE.reject.bind(PROMISE));
  prop$$1('all', PROMISE.all.bind(PROMISE));
  prop$$1('then', function (fn) {
    return new PROMISE(fn)
  });
}

function initCloneThen (ref) {
  var prop$$1 = ref.prop;
  var clone$$1 = ref.clone;
  var resolve = ref.resolve;
  var then = ref.then;

  if (!probe.MessageChannel) {
    prop$$1('cloneThen', function (value) {
      return resolve().then(function () { return resolve(clone$$1(value)); })
    });
    return
  }
  /* global MessageChannel */
  var channel = new MessageChannel();
  var maps = {};
  var idx = 0;
  var port2 = channel.port2;
  port2.start();
  port2.onmessage = function (ref) {
    var ref_data = ref.data;
    var key = ref_data.key;
    var value = ref_data.value;

    var resolve = maps[key];
    resolve(value);
    delete maps[key];
  };
  prop$$1('cloneThen', function (value) {
    return new Promise(function (resolve) {
      var key = idx++;
      maps[key] = resolve;
      try {
        channel.port1.postMessage({key: key, value: value});
      } catch (err) {
        console.error('cloneThen.postMessage', err);
        delete maps[key];
        try {
          value = JSON.parse(JSON.stringify(value));
        } catch (err) {
          console.error('cloneThen.JSON', err);
          value = clone$$1(value);
        }
        return then(function () { return resolve(value); })
      }
    })
  });
}

function normalizeMap (map) {
  return Array.isArray(map) ? map.map(function (key) {
    return {
      key: key,
      val: key
    }
  }) : Object.keys(map).map(function (key) {
    return {
      key: key,
      val: map[key]
    }
  })
}

// 深度比较复制
function testAndUpdateDeepth (oldState, newState, defineReactive, isVueRoot) {
  Object.keys(newState).forEach(function (name) {
    if (!(name in oldState)) {
      // 新加入的属性
      return defineReactive(oldState, name, newState[name])
    }
    // 旧的比较赋值
    var newValue = newState[name];
    var oldValue = oldState[name];
    if (isObject(newValue)) {
      if (!isObject(oldValue)) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        delete oldState[name]; // 需要先删除
        defineReactive(oldState, name, newValue);
        if (isVueRoot) { // 必须再通知一下
          oldValue.__ob__.dep.notify();
        }
      } else { // 继续深度比较赋值
        testAndUpdateDeepth(oldState[name], newValue, defineReactive);
      }
    } else if (isArray(newValue)) {
      if (!isArray(oldValue)) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        delete oldState[name]; // 需要先删除
        defineReactive(oldState, name, newValue);
        if (isVueRoot) { // 必须再通知一下
          oldValue.__ob__.dep.notify();
        }
      } else {
        testAndUpdateArray(oldValue, newValue, defineReactive);
      }
    } else { // 简单类型 直接赋值
      oldState[name] = newState[name];
    }
  });
}

function testAndUpdateArray (oldValue, newValue, defineReactive) {
  var oldLen = oldValue.length;
  var newLen = newValue.length;
  if (oldLen > newLen) { // 多了删掉
    oldValue.splice(newLen, oldLen);
  } else if (oldLen < newLen) { // 少了补上
    while (oldValue.length < newLen) {
      oldValue.push(null);
    }
  }
  newValue.forEach(function (it, id) {
    if (isObject(it)) {
      if (!isObject(oldValue[id])) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it);
      } else { // 复制对象
        testAndUpdateDeepth(oldValue[id], it, defineReactive);
      }
    } else if (isArray(it)) {
      if (!isArray(oldValue[id])) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it);
      } else {
        testAndUpdateArray(oldValue[id], it, defineReactive);
      }
    } else { // 简单类型 直接赋值
      if (it !== oldValue[id]) {
        oldValue.splice(id, 1, it);
      }
    }
  });
}

function resetStoreVM (Vue$$1, flux, vaf, state) {
  var oldVm = vaf.vm;
  if (oldVm) {
    flux.off('update', vaf.watch);
  }
  var silent = Vue$$1.config.silent;
  Vue$$1.config.silent = true;
  var vm = vaf.vm = new Vue$$1({ data: {state: state} });
  flux.on('update', vaf.watch = function (newState) {
    return testAndUpdateDeepth(vm.state, newState, Vue$$1.util.defineReactive, true)
    // if (isVmGetterMode) {
    //   let updates = []
    //   for (let key in newState) {
    //     if (key in vm.state) {
    //       vm.state[key] = newState[key]
    //     } else { // dynamic computed methods
    //       Vue.util.defineReactive(vm.state, key, newState[key])
    //       if (vmGetterMaps[key]) {
    //         vmGetterMaps[key].forEach((vmIt) => {
    //           if (vmIt._computedWatchers && vmIt._computedWatchers[key]) {
    //             updates.indexOf(vmIt) === -1 && updates.push(vmIt)
    //             vmIt._computedWatchers[key].update()
    //           }
    //         })
    //       }
    //     }
    //   }
    //   updates.forEach(vm => vm.$forceUpdate())
    // } else { // old version use mapGetters
    //   for (let key in newState) {
    //     vm.state[key] = newState[key]
    //   }
    // }
  });
  Vue$$1.config.silent = silent;
  if (oldVm) {
    oldVm.state = null;
    Vue$$1.nextTick(function () { return oldVm.$destroy(); });
  }
}

var Vue$1;

function FluxVue (ref) {
  var flux = ref.flux;
  var mixinActions = ref.mixinActions; if ( mixinActions === void 0 ) mixinActions = false;
  var injects = ref.injects; if ( injects === void 0 ) injects = [];
  var router = ref.router;
  var onRouteFail = ref.onRouteFail;
  var payload = ref.payload;
  var deepth = ref.deepth; if ( deepth === void 0 ) deepth = -1;

  var vaf = {
    dispatch: flux.dispatch,
    proxy: flux.proxy
  };
  injects.forEach(function (key) {
    vaf[key] = flux[key];
  });
  resetStoreVM(Vue$1, flux, vaf, flux.getState());
  flux.on('replace', function (state) {
    resetStoreVM(Vue$1, flux, vaf, state);
  });
  if (mixinActions) {
    Vue$1.mixin({
      methods: mapActions(unique(
        Object.keys(flux.mutations).concat(Object.keys(flux.actions))
      ))
    });
  }
  Vue$1.mixin({
    methods: {
      dispatch: function dispatch (method, payload) {
        return vaf.dispatch(method, payload)
      }
    }
  });
  if (router) {
    router.beforeEach(function (to, from, next$$1) {
      var matchedComponents = router.getMatchedComponents(to);
      if (matchedComponents.length) {
        var args = {
          dispatch: vaf.dispatch,
          route: to,
          from: from,
          state: vaf.vm.state
        };
        Promise.all(getComponentsPayloads(matchedComponents, deepth).map(function (Component) {
          if (payload) {
            return payload(Component, args, to, from)
          }
          return Component.payload(args)
        })).then(next$$1).catch(function (err) {
          if (!(err instanceof Error)) {
            return next$$1(err)
          }
          if (onRouteFail) {
            return onRouteFail(to, from, next$$1, err)
          } else {
            next$$1(false);
          }
        });
      } else {
        next$$1();
      }
    });
  }
  return vaf
}

function getComponentsPayloads (components, depth) {
  var payloads = [];
  if (Array.isArray(components)) {
    for (var i =0; i < components.length; ++i) {
      var com = components[i];
      if (com.payload) {
        payloads.push(com);
      }
      if (depth && com.components) {
        payloads = payloads.concat(getComponentsPayloads(com.components, depth--));
      }
    }
  } else {
    for (var comName in components) {
      var com$1 = components[comName];
      if (com$1.payload) {
        payloads.push(com$1);
      }
      if (depth && com$1.components) {
        payloads = payloads.concat(getComponentsPayloads(com$1.components, depth--));
      }
    }
  }
  return payloads
}

var vmGetterMaps = {};
var isVmGetterMode = false;

function registerVmGetters (vm, getters) {
  isVmGetterMode || (isVmGetterMode = true);
  getters = vm._getters = Object.keys(getters);
  getters.forEach(function (key) {
    var arr = vmGetterMaps[key] || (vmGetterMaps[key] = []);
    arr.push(vm);
  });
}

function destroyVmGetters (vm) {
  if (vm._getters) {
    vm._getters.forEach(function (key) {
      if (vmGetterMaps[key]) {
        var arr = vmGetterMaps[key];
        var pos = arr.indexOf(vm);
        if (pos >= -1) {
          arr.splice(pos, 1);
        }
      }
    });
  }
}

FluxVue.install = function install (vue) {
  Vue$1 = vue;
  Vue$1.mixin({
    beforeCreate: function beforeCreate () {
      var this$1 = this;

      var options = this.$options;
      if (options.vaf) {
        this.$flux = options.vaf;
      } else if (options.parent && options.parent.$flux) {
        this.$flux = options.parent.$flux;
      }
      var proxys = options.proxys;
      var methods = options.methods;
      var actions = options.actions;
      var getters = options.getters;
      var computed = options.computed;
      if (this.$flux) {
        if (actions) {
          methods || (methods = options.methods = {});
          Object.assign(methods, mapActions(actions));
        }
        if (getters) {
          computed || (computed = options.computed = {});
          var getterMaps = mapGetters(getters);
          registerVmGetters(this, getterMaps);
          Object.assign(computed, getterMaps);
        }
        if (proxys) {
          var maps = this.__vafMaps = {};
          Object.keys(proxys).map(function (key) {
            maps[key] = (typeof proxys[key] === 'function' ? proxys[key] : methods[proxys[key]]).bind(this$1);
          });
          this.$flux.proxy(maps);
        }
      }
    },
    beforeDestroy: function beforeDestroy () {
      var options = this.$options;
      var proxys = options.proxys;
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
function mapGetters (getters) {
  var res = {};
  normalizeMap(getters).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;
    res[key] = isFunction(val) ? function mappedGetter () { // function(state){}
      return val.call(this, this.$flux.vm.state)
    } : function mappedGetter () {
      return this.$flux.vm.state[val]
    };
  });
  return res
}

function mapActions (actions) {
  var res = {};
  normalizeMap(actions).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;
    res[key] = function mappedAction (payload) {
      if (!this.$flux) {
        var message = "can not call action " + key + " without flux";
        return Promise.reject(new Error(message))
      }
      return this.$flux.dispatch(val, payload)
    };
  });
  return res
}

var FluxRedux = function FluxRedux (ref) {
  var this$1 = this;
  var flux = ref.flux;

  this.flux = flux;
  this.dispatch = flux.dispatch;
  this.state = flux.getState();
  flux.on('update', this.watchUpdate = function (newState) {
    this$1.state = Object.assign({}, this$1.state, newState);
    flux.emit('redux_change');
  });
  flux.on('replace', this.watchReplace = function (newState) {
    this$1.state = newState;
    flux.emit('redux_change');
  });
};
FluxRedux.prototype.getState = function getState () {
  return this.state
};
FluxRedux.prototype.subscribe = function subscribe (fn) {
  return this.flux.subscribe('redux_change', fn)
};

function syncState (keys, sync) {
  var ret = {};
  keys.forEach(function (key) {
    ret[key] = sync[key]();
  });
  return ret
}

function syncBinder (binder) {
  if (binder.vms.length) {
    var state = syncState(binder.keys, binder.sync);
    binder.vms.forEach(function (vm) { return vm.update(state); });
  }
}

function syncBinderKeys (binder, keys) {
  var state = syncState(keys.filter(function (key) { return binder.keys.indexOf(key) >= 0; }), binder.sync);
  binder.vms.forEach(function (vm) { return vm.update(state); });
}

var _startIdx = 0;

var TodoModule = {
	state: {
		todoList: [],
	},
	mutations: {
		createNew: function createNew (ref, newItem) {
			var todoList = ref.state.todoList;

			todoList.push(newItem);
			return { todoList: todoList }
		},
		toggleCompleted: function toggleCompleted (ref, todo) {
			var todoList = ref.state.todoList;

			for (var i= 0, l = todoList.length; i < l ; ++ i) {
				if (todoList[i].id == todo.id) {
					var it = todoList[i];
					if (it.isCompleted == todo.isCompleted) {
						it.isCompleted = !todo.isCompleted;
						return { todoList: todoList }
					}
				}
			}
		},
		removeItemById: function removeItemById (ref, id) {
			var todoList = ref.state.todoList;

			for (var i= todoList.length -1; i >=0 ; --i) {
				if (todoList[i].id == id) {
					todoList.splice(i, 1);
					return { todoList: todoList }
				}
			}
		},
		restoreItems: function restoreItems (_, todoList) {
			if (!Array.isArray(todoList)) {
				todoList = [];
			}
			_startIdx = todoList.length;
			return {
				todoList: todoList
			}
		}
	},
	actions: {
		createNew: function createNew$1 (ref, title) {
			var resolve = ref.resolve;
			var commit = ref.commit;
			var dispatch = ref.dispatch;

			var newItem = {};
			newItem.title = title;
			newItem.id = ++ _startIdx; 
			newItem.isCompleted = false;
			commit.createNew(newItem);
			return dispatch.onCreateNew(newItem)
		}
	}
};

var Todo = {
render: function(){with(this){return _c('div',{staticClass:"todolist"},[_c('h4',[_v("TODO LIST"),_c('i',[_v("(create times "+_s(count)+")")])]),_v(" "),_c('ul',_l((todoList),function(child){return _c('li',[_c('label',[_c('input',{attrs:{"type":"checkbox"},domProps:{"checked":child.isCompleted},on:{"change":function($event){toggleCompleted(child)}}}),_v(" "),_c('span',[_v(_s(child.title))])]),_v(" "),_c('button',{on:{"click":function($event){removeItemById(child.id)}}},[_v("x")])])})),_v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(newText),expression:"newText"}],attrs:{"type":"text"},domProps:{"value":(newText)},on:{"input":function($event){if($event.target.composing)return;newText=$event.target.value}}}),_v(" "),_c('button',{on:{"click":function($event){createNew(newText)}}},[_v("Add")])])}},
staticRenderFns: [],
		computed: mapGetters([
			'todoList'
		]),
		data: function () {
			return {
				newText: '',
				count: 0
			}
		},
		payload: function payload (ref) {
			var dispatch = ref.dispatch;

			return dispatch('restoreItems', [{
				title: 'payload-todo',
				id: 1,
				isCompleted: true
			}])
		},
		proxys: {
			onCreateNew: function onCreateNew (ref, item) {
				var resolve = ref.resolve;

				this.count++;
				return resolve('ok')
			}
		}
	};

Vue.use(FluxVue);

var flux = new Flux({
	strict: true // enable this for promise action to resolve data copy
});
flux.declare(TodoModule);

var router = new VueRouter({
  routes: [
    {
      name: "Todo",
      path: "/",
      component: Todo
    }
  ]
});

var app = new Vue({
	vaf: new FluxVue({
		flux: flux,
    router: router,
		mixinActions: true
	}),
  router: router,
	el: '#app'
});

window.flux = flux;

return app;

}(Vue,VueRouter));
