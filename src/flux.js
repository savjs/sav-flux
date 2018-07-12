import { bindEvent, extend, clone, isPromiseLike, probe, isObject } from 'sav-util'

export function Flux (opts = {strict: true}) {
  let flux = this
  let prop = initProp(flux)
  prop('flux', flux)
  prop('prop', prop)
  prop('mutations', {})
  prop('actions', {})
  prop('proxys', {})
  prop('opts', opts)
  initUse(flux)([initUtil, bindEvent, initPromise, initCloneThen,
    initState, initCommit, initDispatch, initProxy,
    initDeclare])
}

function initProp (flux) {
  let prop = (key, value, opts = {}) => {
    opts.value = value
    Object.defineProperty(flux, key, opts)
  }
  prop.get = (key, value, opts = {}) => {
    opts.get = value
    Object.defineProperty(flux, key, opts)
  }
  return prop
}

function initUse ({flux, prop}) {
  let use = (plugin, opts) => {
    if (Array.isArray(plugin)) {
      return plugin.forEach(plugin => {
        flux.use(plugin, opts)
      })
    }
    plugin(flux, opts)
  }
  prop('use', use)
  return use
}

function initUtil ({prop, opts}) {
  prop('clone', clone)
  prop('extend', extend)
  prop('opt', (name, defaultVal = null) => {
    return name in opts ? opts[name] : defaultVal
  })
}

function initState ({prop, emit, cloneThen, clone, resolve}) {
  let state = {}
  prop.get('state', () => state, {
    set () {
      throw new Error('[flux] Use flux.replaceState() to explicit replace store state.')
    }
  })
  prop('getState', () => clone(state))

  prop('replaceState', newState => {
    let stateStr = JSON.stringify(newState)
    newState = JSON.parse(stateStr)
    for (let x in state) {
      delete state[x]
    }
    for (let x in newState) {
      state[x] = newState[x]
    }
    return Promise.resolve(JSON.parse(stateStr)).then((cloneState) => {
      emit('replace', cloneState)
      return cloneState
    })
  })

  prop('updateState', (changedState, slice) => {
    if (typeof changedState !== 'object') {
      throw new Error('[flux] updateState require new state as object')
    }
    if (changedState !== state) {
      Object.keys(changedState).map(key => {
        state[key] = changedState[key]
      })
    }
    if (!slice) {
      return cloneThen(changedState).then(cloneState => {
        emit('update', cloneState)
        return cloneState
      })
    }
    return resolve()
  })
}

function initCommit ({prop, flux, updateState, resolve}) {
  let commit = (type, payload, fetch) => {
    let {mutations} = flux
    if (typeof type === 'object') {
      payload = type
      type = type.type
    }
    let entry = mutations[type]
    if (!entry) {
      throw new Error('[flux] unknown mutation : ' + type)
    }
    let state = flux.state
    let ret = entry(flux, payload, fetch)
    let update = (ret) => {
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
    }
    if (isPromiseLike(ret)) {
      return ret.then(update)
    } else {
      return update(ret)
    }
  }
  prop('commit', flux.opts.noProxy ? commit : proxyApi(commit))
}

function initDispatch ({prop, flux, commit, resolve, reject, opts, cloneThen}) {
  let dispatch = (action, payload, fetch) => {
    let {actions, mutations, proxys} = flux
    let entry = action in actions && actions[action] ||
      action in mutations && function (_, payload, fetch) {
        return commit(action, payload, fetch)
      }
    if (!entry && (proxys[action])) {
      entry = proxys[action]
    }
    if (!entry) {
      return reject('[flux] unknown action : ' + action)
    }
    let err, ret
    try {
      ret = entry(flux, payload, fetch)
    } catch (e) {
      err = e
    }
    if (err) {
      return reject(err)
    }
    if (!isPromiseLike(ret)) {
      ret = resolve(ret)
    }
    if (fetch) {
      return ret
    }
    // make copy
    return opts.strict ? ret.then(data => {
      if (Array.isArray(data) || isObject(data)) {
        if (data.__clone) {
          return resolve(data)
        }
        return cloneThen(data).then(newData => {
          Object.defineProperty(newData, '__clone', {value: true})
          return resolve(newData)
        })
      }
      return resolve(data)
    }) : ret
  }
  prop('dispatch', flux.opts.noProxy ? dispatch : proxyApi(dispatch))
}

function initProxy ({prop, proxys}) {
  prop('proxy', (name, value) => {
    if (typeof name === 'object') { // batch mode
      for (let x in name) {
        if (value === null) {
          delete proxys[x]
        } else {
          proxys[x] = name[x]
        }
      }
    } else { // once mode
      if (value === null) {
        delete proxys[name]
      } else {
        proxys[name] = value
      }
    }
  })
}

function initDeclare ({prop, flux, emit, commit, dispatch, updateState}) {
  let declare = (mod) => {
    if (!mod) {
      return
    }
    if (Array.isArray(mod)) {
      return mod.forEach(declare)
    }
    if (mod.mutations) {
      for (let mutation in mod.mutations) {
        if (flux.mutations[mutation]) {
          throw new Error(`[flux] mutation exists: ${mutation}`)
        }
        flux.mutations[mutation] = mod.mutations[mutation]
        if (flux.opts.noProxy || !probe.Proxy) {
          proxyFunction(commit, mutation)
          proxyFunction(dispatch, mutation)
        }
      }
    }
    if (mod.proxys) {
      for (let action in mod.proxys) {
        flux.proxys[action] = mod.proxys[action]
      }
    }
    if (mod.actions) {
      for (let action in mod.actions) {
        if (flux.actions[action]) {
          throw new Error(`[flux] action exists: ${action}`)
        }
        flux.actions[action] = mod.actions[action]
        if (flux.opts.noProxy || !probe.Proxy) {
          proxyFunction(dispatch, action)
        }
      }
    }
    if (mod.state) {
      let states = flux.state
      for (let state in mod.state) {
        if (state in states) {
          throw new Error(`[flux] state exists: ${state}`)
        }
      }
      updateState(mod.state, true)
    }
    emit('declare', mod)
  }
  prop('declare', declare)
}

function proxyFunction (target, name) {
  target[name] = (payload) => {
    return target(name, payload)
  }
}

function proxyApi (entry) {
  if (probe.Proxy) {
    return new Proxy(entry, {
      get (target, name) {
        if (name === 'bind') { // @NOTE vue 2.5 使用了bind
          return () => entry
        }
        return (payload, fetch) => {
          return entry(name, payload, fetch)
        }
      }
    })
  }
  return entry
}

function initPromise ({prop}) {
  let PROMISE = Promise
  prop('resolve', PROMISE.resolve.bind(PROMISE))
  prop('reject', PROMISE.reject.bind(PROMISE))
  prop('all', PROMISE.all.bind(PROMISE))
  prop('then', fn => {
    return new PROMISE(fn)
  })
}

function initCloneThen ({prop, clone, resolve, then}) {
  if (!probe.MessageChannel) {
    prop('cloneThen', value => {
      return resolve().then(() => resolve(clone(value)))
    })
    return
  }
  /* global MessageChannel */
  const channel = new MessageChannel()
  let maps = {}
  let idx = 0
  let port2 = channel.port2
  port2.start()
  port2.onmessage = ({data: {key, value}}) => {
    const resolve = maps[key]
    resolve(value)
    delete maps[key]
  }
  prop('cloneThen', value => {
    return new Promise(resolve => {
      const key = idx++
      maps[key] = resolve
      try {
        channel.port1.postMessage({key, value})
      } catch (err) {
        console.error('cloneThen.postMessage', err)
        delete maps[key]
        try {
          value = JSON.parse(JSON.stringify(value))
        } catch (err) {
          console.error('cloneThen.JSON', err)
          value = clone(value)
        }
        return then(() => resolve(value))
      }
    })
  })
}
