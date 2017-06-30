import {isFunction, unique} from 'sav-util'
import {normalizeMap} from './util.js'

function resetStoreVM (Vue, flux, vaf, state) {
  let oldVm = vaf.vm
  if (oldVm) {
    flux.off('update', vaf.watch)
  }
  const silent = Vue.config.silent
  Vue.config.silent = true
  let vm = vaf.vm = new Vue({ data: {state} })
  flux.on('update', vaf.watch = (newState) => {
    if (isVmGetterMode) {
      let updates = []
      for (let key in newState) {
        if (key in vm.state) {
          vm.state[key] = newState[key]
        } else { // dynamic computed methods
          Vue.util.defineReactive(vm.state, key, newState[key])
          if (vmGetterMaps[key]) {
            vmGetterMaps[key].forEach((vmIt) => {
              if (vmIt._computedWatchers && vmIt._computedWatchers[key]) {
                updates.indexOf(vmIt) === -1 && updates.push(vmIt)
                vmIt._computedWatchers[key].update()
              }
            })
          }
        }
      }
      updates.forEach(vm => vm.$forceUpdate())
    } else { // old version use mapGetters
      for (let key in newState) {
        vm.state[key] = newState[key]
      }
    }
  })
  Vue.config.silent = silent
  if (oldVm) {
    oldVm.state = null
    Vue.nextTick(() => oldVm.$destroy())
  }
}

let Vue

export function FluxVue ({flux, mixinActions = false, injects = []}) {
  let vaf = {
    dispatch: flux.dispatch,
    proxy: flux.proxy
  }
  injects.forEach(key => {
    vaf[key] = flux[key]
  })
  resetStoreVM(Vue, flux, vaf, flux.getState())
  flux.on('replace', (state) => {
    resetStoreVM(Vue, flux, vaf, state)
  })
  if (mixinActions) {
    Vue.mixin({
      methods: mapActions(unique(
        Object.keys(flux.mutations).concat(Object.keys(flux.actions))
      ))
    })
  }
  Vue.mixin({
    methods: {
      dispatch (method, payload) {
        return vaf.dispatch(method, payload)
      }
    }
  })
  return vaf
}

let vmGetterMaps = {}
let isVmGetterMode = false

function registerVmGetters (vm, getters) {
  isVmGetterMode || (isVmGetterMode = true)
  getters = vm._getters = Object.keys(getters)
  getters.forEach((key) => {
    let arr = vmGetterMaps[key] || (vmGetterMaps[key] = [])
    arr.push(vm)
  })
}

function destroyVmGetters (vm) {
  if (vm._getters) {
    vm._getters.forEach((key) => {
      if (vmGetterMaps[key]) {
        let arr = vmGetterMaps[key]
        let pos = arr.indexOf(vm)
        if (pos >= -1) {
          arr.splice(pos, 1)
        }
      }
    })
  }
}

FluxVue.install = function install (vue) {
  Vue = vue
  Vue.mixin({
    beforeCreate () {
      const options = this.$options
      if (options.vaf) {
        this.$flux = options.vaf
      } else if (options.parent && options.parent.$flux) {
        this.$flux = options.parent.$flux
      }
      let {proxys, methods, actions, getters, computed} = options
      if (this.$flux) {
        if (actions) {
          methods || (methods = options.methods = {})
          Object.assign(methods, mapActions(actions))
        }
        if (getters) {
          computed || (computed = options.computed = {})
          let getterMaps = mapGetters(getters)
          registerVmGetters(this, getterMaps)
          Object.assign(computed, getterMaps)
        }
        if (proxys) {
          let maps = this.__vafMaps = {}
          Object.keys(proxys).map((key) => {
            maps[key] = (typeof proxys[key] === 'function' ? proxys[key] : methods[proxys[key]]).bind(this)
          })
          this.$flux.proxy(maps)
        }
      }
    },
    beforeDestroy () {
      const options = this.$options
      let {proxys} = options
      if (proxys && this.$flux && this.__vafMaps) {
        this.$flux.proxy(this.__vafMaps, null)
      }
      if (isVmGetterMode) {
        destroyVmGetters(this)
      }
      if (this.$flux) {
        delete this.$flux
      }
    }
  })
}

// 后续不建议使用
export function mapGetters (getters) {
  let res = {}
  normalizeMap(getters).forEach(function (ref) {
    let key = ref.key
    let val = ref.val
    res[key] = isFunction(val) ? function mappedGetter () { // function(state){}
      return val.call(this, this.$flux.vm.state)
    } : function mappedGetter () {
      return this.$flux.vm.state[val]
    }
  })
  return res
}

export function mapActions (actions) {
  let res = {}
  normalizeMap(actions).forEach((ref) => {
    let key = ref.key
    let val = ref.val
    res[key] = function mappedAction (payload) {
      if (!this.$flux) {
        let message = `can not call action ${key} without flux`
        return Promise.reject(new Error(message))
      }
      return this.$flux.dispatch(val, payload)
    }
  })
  return res
}
