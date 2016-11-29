import { bindEvent, extend, clone, isPromiseLike, probe } from 'sav-util'

export function Flux (opts = {strict: true}) {
  let flux = this
  let prop = initProp(flux)
  let {val} = prop
  val('flux', flux)
  val('prop', prop)
  val('mutations', {})
  val('actions', {})
  val('proxys', {})
  val('opts', opts)
  initUse(flux)([initUtil, bindEvent, initPromise, initCloneThen,
    initState, initCommit, initDispatch, initProxy,
    initDeclare])
}

function initProp (flux) {
  return {
    get (key, val, opts = {}) {
      opts.get = val
      Object.defineProperty(flux, key, opts)
    },
    val (key, val, opts = {}) {
      opts.value = val
      Object.defineProperty(flux, key, opts)
    }
  }
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
  prop.val('use', use)
  return use
}

function initUtil ({prop}) {
  prop.val('clone', clone)
  prop.val('extend', extend)
}

function initState ({prop, emit, cloneThen, clone, resolve}) {
  let state = {}
  prop.get('state', () => state, {
    set () {
      throw new Error('[flux] Use flux.replaceState() to explicit replace store state.')
    }
  })
  prop.val('getState', () => clone(state))

  prop.val('replaceState', newState => {
    state = newState
    return cloneThen(newState).then(cloneState => {
      emit('replace', cloneState)
      return cloneState
    })
  })

  prop.val('updateState', (changedState, slice) => {
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
  let commit = (type, payload) => {
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
    let ret = entry(flux, payload)
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
  prop.val('commit', proxyApi(commit))
}

function initDispatch ({prop, flux, commit, resolve, reject, opts, cloneThen}) {
  let dispatch = (action, payload) => {
    let {actions, mutations, proxys} = flux
    let entry = action in actions && actions[action] ||
      action in mutations && function (_, payload) {
        return commit(action, payload)
      }
    if (!entry && (proxys[action])) {
      entry = proxys[action]
    }
    if (!entry) {
      return reject('[flux] unknown action : ' + action)
    }
    let err, ret
    try {
      ret = entry(flux, payload)
    } catch (e) {
      err = e
    }
    if (err) {
      return reject(err)
    }
    if (!isPromiseLike(ret)) {
      ret = resolve(ret)
    }
        // make copy
    return opts.strict ? ret.then(data => {
      if (Array.isArray(data) || typeof data === 'object') {
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
  prop.val('dispatch', proxyApi(dispatch))
}

function initProxy ({prop, proxys}) {
  prop.val('proxy', (name, value) => {
    if (typeof name === 'object') { // batch mode
      for (var x in name) {
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
        flux.mutations[mutation] = mod.mutations[mutation]
        if (!probe.Proxy) {
          proxyFunction(commit, mutation)
          proxyFunction(dispatch, mutation)
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
        flux.actions[action] = mod.actions[action]
        if (!probe.Proxy) {
          proxyFunction(dispatch, action)
        }
      }
    }
    if (mod.state) {
      updateState(mod.state, true)
    }
    emit('declare', mod)
  }
  prop.val('declare', declare)
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
        return payload => {
          return entry(name, payload)
        }
      }
    })
  }
  return entry
}

function initPromise ({prop}) {
  let PROMISE = Promise
  prop.val('resolve', PROMISE.resolve.bind(PROMISE))
  prop.val('reject', PROMISE.reject.bind(PROMISE))
  prop.val('all', PROMISE.all.bind(PROMISE))
  prop.val('then', fn => {
    return new PROMISE(fn)
  })
}

function initCloneThen ({prop, clone, resolve, then}) {
  if (!probe.MessageChannel) {
    prop.val('cloneThen', value => {
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
  prop.val('cloneThen', value => {
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
