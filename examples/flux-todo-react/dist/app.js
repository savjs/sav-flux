function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var ReactDOM = _interopDefault(require('react-dom'));
var reactRedux = require('react-redux');

/*!
 * sav-util v0.0.7
 * (c) 2016 jetiny 86287344@qq.com
 * Release under the MIT License.
 */
function toStringType(val) {
  return Object.prototype.toString.call(val).slice(8, -1);
}

var isArray = Array.isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isObject(arg) {
  return toStringType(arg) === 'Object' && arg !== null;
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
      if (uri.protocol) {
        str += uri.protocol + ':';
      }
      str += '//';
      if (uri.user) {
        str += uri.user + ':';
      }
      if (uri.password) {
        str += uri.password + '@';
      }
      str += uri.host;
      if (uri.port) {
        str += ':' + uri.port;
      }
    }
    str += uri.path || '';
    if (uri.query) {
      str += '?' + uri.query;
    }
    if (uri.anchor) {
      str += '#' + uri.anchor;
    }
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
  if (opts === void 0) opts = {};

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

function isPromiseLike(obj) {
  return obj && obj.then;
}

function prop(target, key, value) {
  Object.defineProperty(target, key, { value: value });
}

function bindEvent(target) {
  var _events = {};
  prop(target, 'on', function (event, fn) {
    (_events[event] || (_events[event] = [])).push(fn);
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
      var args = [],
          len = arguments.length;
      while (len--) args[len] = arguments[len];

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
    var args = [],
        len = arguments.length - 1;
    while (len-- > 0) args[len] = arguments[len + 1];

    if (_events[event]) {
      var list = _events[event].slice();
      var fn;
      while (fn = list.shift()) {
        fn.apply(void 0, args);
      }
    }
  });
}

var PROMISE = Promise;
var promise = {
  resolve: PROMISE.resolve.bind(PROMISE),
  reject: PROMISE.reject.bind(PROMISE),
  all: PROMISE.all.bind(PROMISE),
  then: function (fn) {
    return new PROMISE(fn);
  }
};

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

function camelCase(s) {
  return s.replace(/-(.)/g, function (a, $1) {
    return $1.toUpperCase();
  });
}

function Flux(opts = { strict: true }) {
  let flux = this;
  let prop$$1 = initProp(flux);
  let { val } = prop$$1;
  val('flux', flux);
  val('prop', prop$$1);
  val('mutations', {});
  val('actions', {});
  val('proxys', {});
  val('opts', opts);
  initUse(flux)([initUtil, bindEvent, initPromise, initCloneThen, initState, initCommit, initDispatch, initProxy, initDeclare]);
}

function initProp(flux) {
  return {
    get(key, val, opts = {}) {
      opts.get = val;
      Object.defineProperty(flux, key, opts);
    },
    val(key, val, opts = {}) {
      opts.value = val;
      Object.defineProperty(flux, key, opts);
    }
  };
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
  prop$$1.val('use', use);
  return use;
}

function initUtil({ prop: prop$$1 }) {
  prop$$1.val('clone', clone);
  prop$$1.val('extend', extend);
}

function initState({ prop: prop$$1, emit, cloneThen, clone: clone$$1, resolve }) {
  let state = {};
  prop$$1.get('state', () => state, {
    set() {
      throw new Error('[flux] Use flux.replaceState() to explicit replace store state.');
    }
  });
  prop$$1.val('getState', () => clone$$1(state));

  prop$$1.val('replaceState', newState => {
    for (let x in state) {
      delete state[x];
    }
    for (let x in newState) {
      state[x] = newState[x];
    }
    return cloneThen(newState).then(cloneState => {
      emit('replace', cloneState);
      return cloneState;
    });
  });

  prop$$1.val('updateState', (changedState, slice) => {
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
  prop$$1.val('commit', proxyApi(commit));
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
  prop$$1.val('dispatch', proxyApi(dispatch));
}

function initProxy({ prop: prop$$1, proxys }) {
  prop$$1.val('proxy', (name, value) => {
    if (typeof name === 'object') {
      // batch mode
      for (var x in name) {
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
        flux.mutations[mutation] = mod.mutations[mutation];
        if (!probe.Proxy) {
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
      for (let action in mod.actions) {
        flux.actions[action] = mod.actions[action];
        if (!probe.Proxy) {
          proxyFunction(dispatch, action);
        }
      }
    }
    if (mod.state) {
      updateState(mod.state, true);
    }
    emit('declare', mod);
  };
  prop$$1.val('declare', declare);
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
  prop$$1.val('resolve', PROMISE.resolve.bind(PROMISE));
  prop$$1.val('reject', PROMISE.reject.bind(PROMISE));
  prop$$1.val('all', PROMISE.all.bind(PROMISE));
  prop$$1.val('then', fn => {
    return new PROMISE(fn);
  });
}

function initCloneThen({ prop: prop$$1, clone: clone$$1, resolve, then }) {
  if (!probe.MessageChannel) {
    prop$$1.val('cloneThen', value => {
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
  prop$$1.val('cloneThen', value => {
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

let Vue;

class FluxRedux {
  constructor({ flux }) {
    this.flux = flux;
    this.dispatch = flux.dispatch;
    this.state = flux.getState();
    flux.on('update', this.watchUpdate = newState => {
      this.state = Object.assign({}, this.state, newState);
      flux.emit('redux_change');
    });
    flux.on('replace', this.watchReplace = newState => {
      this.state = newState;
      flux.emit('redux_change');
    });
  }
  getState() {
    return this.state;
  }
  subscribe(fn) {
    return this.flux.subscribe('redux_change', fn);
  }
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
		}
	},
	actions: {
		createNew({ resolve, commit, dispatch }, title) {
			let newItem = {};
			newItem.title = title;
			newItem.id = ++_startIdx;
			newItem.isCompleted = false;
			return commit.createNew(newItem);
		}
	}
};

let flux = new Flux({
	strict: true // enable this for promise action to resolve data copy
});
flux.declare(TodoModule);

var store = new FluxRedux({ flux });

var _dec;
var _class;

let TodoView = (_dec = reactRedux.connect(state => state, dispatch => ({ dispatch })), _dec(_class = class TodoView extends React.Component {
	constructor(props) {
		super(props);
		this.addTodo = this.addTodo.bind(this);
		this.addTodo100 = this.addTodo100.bind(this);
	}
	addTodo() {
		var val = this.refs.newInput.value;
		if (val) {
			this.props.dispatch.createNew(val);
		}
	}
	addTodo100() {
		var val = this.refs.newInput.value;
		if (val) {
			for (var i = 0; i < 100; ++i) {
				this.props.dispatch('createNew', val + i);
			}
		}
	}
	render() {
		const { dispatch } = this.props;
		return React.createElement(
			'div',
			null,
			React.createElement(
				'h1',
				null,
				'Todo'
			),
			React.createElement('input', { type: 'text', ref: 'newInput' }),
			React.createElement(
				'button',
				{ onClick: this.addTodo },
				'Add'
			),
			React.createElement(
				'button',
				{ onClick: this.addTodo100 },
				'Add 100'
			),
			React.createElement(
				'ol',
				null,
				this.props.todoList.map(function (child) {
					return React.createElement(
						'li',
						{ key: child.id },
						React.createElement(
							'label',
							null,
							React.createElement('input', { type: 'checkbox',
								'data-id': child.id,
								checked: child.isCompleted,
								onChange: () => dispatch.toggleCompleted(child)
							}),
							React.createElement(
								'span',
								null,
								child.title
							)
						),
						React.createElement(
							'button',
							{ onClick: () => dispatch.removeItemById(child.id) },
							'x'
						)
					);
				})
			)
		);
	}
}) || _class);

ReactDOM.render(React.createElement(
  reactRedux.Provider,
  { store: store },
  React.createElement(TodoView, null)
), document.querySelector('#app'));
