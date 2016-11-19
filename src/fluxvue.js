import {isFunction, unique} from 'sav-util'

function resetStoreVM (Vue, flux, vaf, state) {
  let oldVm = vaf.vm
  if (oldVm) {
    flux.off('update', vaf.watch)
  }
  const silent = Vue.config.silent
  Vue.config.silent = true
  let vm = vaf.vm = new Vue({ data: {state} })
  flux.on('update', vaf.watch = (newState) => {
    for (let key in newState) {
      vm.state[key] = newState[key]
    }
  })
  Vue.config.silent = silent
  if (oldVm) {
    oldVm.state = null
    Vue.nextTick(() => oldVm.$destroy())
  }
}

let Vue

export function FluxVue ({flux, mixinActions = false}) {
  let vaf = {
    dispatch: flux.dispatch,
    proxy: flux.proxy
  }
  resetStoreVM(Vue, flux, vaf, flux.getState())
  flux.on('replace', (state) => {
    resetStoreVM(Vue, flux, vaf, state)
  })
  if (mixinActions) {
    Vue.mixin({
      methods: mapActions(unique(
                Object.keys(flux.mutations)
                .concat(Object.keys(flux.actions))
            ))
    })
  }
  return vaf
}

FluxVue.install = function install (vue) {
  Vue = vue
  Vue.mixin({
    beforeCreate () {
      const options = this.$options
      if (options.vaf) {
        this.$vaf = options.vaf
      } else if (options.parent && options.parent.$vaf) {
        this.$vaf = options.parent.$vaf
      }
      let {proxys, methods} = options
      if (proxys && this.$vaf) {
        let maps = this.__vafMaps = {}
        Object.keys(proxys).map((key) => {
          maps[key] = (typeof proxys[key] === 'function' ? proxys[key] : methods[proxys[key]]).bind(this)
        })
        this.$vaf.proxy(maps)
      }
    },
    beforeDestroy () {
      const options = this.$options
      let {proxys} = options
      if (proxys && this.$vaf && this.__vafMaps) {
        this.$vaf.proxy(this.__vafMaps, null)
      }
      if (this.$vaf) {
        delete this.$vaf
      }
    }
  })
}

export function mapGetters (getters) {
  let res = {}
  normalizeMap(getters).forEach(function (ref) {
    let key = ref.key
    let val = ref.val
    res[key] = isFunction(val) ? function mappedGetter () { // function(state){}
      return val.call(this, this.$vaf.vm.state)
    } : function mappedGetter () {
      return this.$vaf.vm.state[val]
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
      return this.$vaf.dispatch(val, payload)
    }
  })
  return res
}

function normalizeMap (map) {
  return Array.isArray(map) ? map.map(key => {
    return {
      key: key,
      val: key
    }
  }) : Object.keys(map).map(key => {
    return {
      key: key,
      val: map[key]
    }
  })
}
