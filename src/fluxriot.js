import {normalizeMap} from './util.js'
import {isFunction, unique} from 'sav-util'

export function FluxRiot ({flux, riot}) {
  let connect = {
    dispatch: flux.dispatch,
    state: flux.getState(),
    binds: {},
    binders: {}
  }
  flux.on('update', (newState) => {
    Object.assign(connect.state, newState)
    let ids = []
    for (let name in newState) {
      ids = ids.concat(connect.binds[name])
    }
    unique(ids)
    let keys = Object.keys(newState)
    ids.forEach((tagName) => {
      let binder = connect.binders[tagName]
      if (binder && binder.vms.length) {
        syncBinderKeys(binder, keys)
      }
    })
  })

  flux.on('replace', (newState) => {
    connect.state = newState
    for(let tagName in connect.binders) {
      syncBinder(connect.binders[tagName])
    }
  })

  riot.mixin({
    init: function () {
      if (this.getters) {
        let tagName = this.__.tagName
        let binder
        if (connect.binders[tagName]) {
          binder = connect.binders[tagName]
        } else {
          let getters = normalizeMap(this.getters);
          let sync = {}
          binder = {
            sync,
            keys: [],
            vms: []
          }
          connect.binders[tagName] = binder
          getters.forEach((key, val) => {
            val = isFunction(val) ? () => {
              val.call(null, connect.state)
            } : () => {
              connect.state[key]
            }
            binder.keys.push(key)
            (connect.binds[key] || (connect.binds[key] = [])).push(tagName)
            sync[key] = val
          })
        }
        this.on('unmount', () => {
          let idx = binder.vms.indexOf(this)
          if (idx >= 0) {
            binder.vms.splice(idx, 1)
          }
        })
        binder.vms.push(this)
        Object.assign(this, syncState(binder.keys, binder.sync))
      }
      if (this.actions) {
        normalizeMap(this.actions).forEach((action) => {
          this[action] = (payload) => {
            return connect.dispatch(action, payload)
          }
        })
      }
    }
  })
}

function syncState (keys, sync) {
  let ret = {}
  keys.forEach((key) => {
    ret[key] = sync[key]()
  })
  return ret
}

function syncBinder (binder) {
  if (binder.vms.length) {
    let state = syncState(binder.keys, binder.sync)
    binder.vms.forEach((vm) => vm.update(state))
  }
}

function syncBinderKeys (binder, keys) {
  let state = syncState(keys.filter((key) => binder.keys.indexOf(key) >= 0), binder.sync)
  binder.vms.forEach((vm) => vm.update(state))
}
