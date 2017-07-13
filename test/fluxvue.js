import test from 'ava'
import {expect} from 'chai'
import {isObject, isArray} from 'sav-util'
import {Flux, FluxVue} from '../src'
import Vue from 'vue'

Vue.use(FluxVue)

function createFluxVm (state) {
  const flux = new Flux({
    strict: true
  })
  flux.declare({
    state: state || {
      arr: [],
      obj: {}
    }
  })
  let vm = new Vue({
    vaf: new FluxVue({
      flux
    }),
    getters: [
      'arr',
      'obj',
      'str'
    ]
  })
  return {
    vm,
    flux
  }
}

function ensureArrOb (arr, raw) {
  expect(arr).to.eql(raw)
  if (Array.isArray(raw)) {
    arr.forEach((it, i) => {
      if (isObject(raw[i]) || isArray(raw[i])) {
        expect(it.__ob__).to.be.a('object')
      } else {
        expect(it.__ob__).to.be.not.a('object')
      }
    })
  }
}

function ss (val) {
  return JSON.stringify(val, null, 2)
}

test('fluxVue.array.simple', async (ava) => {
  expect(ss).to.be.a('function')

  let {vm, flux} = createFluxVm()
  { // 简单类型
    let arr = [1, false, '3']
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 变化类型
    let arr = [false, 1, 3]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 减少个数
    let arr = ['2']
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 增加个数
    let arr = [1, 2, 3]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
})

test('fluxVue.array.change', async (ava) => {
  let {vm, flux} = createFluxVm()
  { // 简单类型
    let arr = [1, false]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 增加并转换
    let arr = [1, {a: 1}, [2, 3]]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 减少并转换
    let arr = [[2, 3], {a: 1}]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
})

test('fluxVue.array.object', async (ava) => {
  let {vm, flux} = createFluxVm()
  { // 深度类型
    let arr = [1, 2, 3]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 转换
    let arr = {a: 1}
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 转换回来
    let arr = [1, 2, 3]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
})

test('fluxVue.array.depth', async (ava) => {
  let {vm, flux} = createFluxVm()
  { // 深度类型
    let arr = [{a: 1}, [{b: 2}, [3, {c: [4]}]]]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
  { // 深度转换类型
    let arr = [[1], [{b: [2]}, [4, {c: {d: 5}}]]]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
})

test('fluxVue.object.update', async (ava) => {
  let {vm, flux} = createFluxVm()
  { // 简单类型
    let obj = {a: 1}
    await flux.updateState({obj})
    ensureArrOb(vm.obj, obj)
  }
  { // 并不能减少个数
    let obj = {}
    await flux.updateState({obj})
    ensureArrOb(vm.obj, {a: 1})
  }
  { // 变化类型
    let obj = {a: [{b: 1}], c: 2}
    await flux.updateState({obj})
    ensureArrOb(vm.obj, obj)
  }
  { // 变化类型
    let obj = {a: [1], c: [{b: 1}]}
    await flux.updateState({obj})
    ensureArrOb(vm.obj, obj)
  }
})

test('fluxVue.inject', async (ava) => {
  let {vm, flux} = createFluxVm({})
  { // 注入字符串
    let str = 'ss'
    await flux.updateState({str})
    ensureArrOb(vm.str, str)
  }
  { // 注入对象
    let obj = {a: [1], c: [{b: 1}]}
    await flux.updateState({obj})
    ensureArrOb(vm.obj, obj)
  }
  { // 注入数组
    let arr = [1, {a: 2}, ['b']]
    await flux.updateState({arr})
    ensureArrOb(vm.arr, arr)
  }
})
