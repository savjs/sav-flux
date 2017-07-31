import {isObject, isArray} from 'sav-util'

export function normalizeMap (map) {
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

// 深度比较复制
export function testAndUpdateDepth (oldState, newState, isVueRoot, Vue) {
  Object.keys(newState).forEach((name) => {
    if (!(name in oldState)) {
      // 新加入的属性
      return Vue.set(oldState, name, newState[name])
    }
    // 旧的比较赋值
    const newValue = newState[name]
    const oldValue = oldState[name]

    if (isObject(newValue)) {
      if (!isObject(oldValue)) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        Vue.delete(oldState, name)
        Vue.set(oldState, name, newValue)
      } else { // 继续深度比较赋值
        testAndUpdateDepth(oldState[name], newValue, false, Vue)
      }
    } else if (isArray(newValue)) {
      if (!isArray(oldValue)) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        Vue.delete(oldState, name)
        Vue.set(oldState, name, newValue)

        // @todo 需要先删除
        // delete oldState[name]
        // const ob = oldState.__ob__
        // defineReactive(ob.value, name, newValue)
        // if (isVueRoot && ob) { // 必须再通知一下
        //   ob.dep.notify()
        // }
      } else {
        testAndUpdateArray(oldValue, newValue, Vue)
      }
    } else { // 简单类型
      if (oldState[name] !== newState[name]) {
        oldState[name] = newState[name]
      }
    }
  })
}

function testAndUpdateArray (oldValue, newValue, Vue) {
  const oldLen = oldValue.length
  const newLen = newValue.length

  if (oldLen > newLen) { // 多了删掉
    oldValue.splice(newLen, oldLen)
  } else if (oldLen < newLen) { // 少了补上
    while (oldValue.length < newLen) {
      oldValue.push(null)
    }
  }
  newValue.forEach((it, id) => {
    if (isObject(it)) {
      if (!isObject(oldValue[id])) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it)
      } else { // 复制对象
        testAndUpdateDepth(oldValue[id], it, false, Vue)
      }
    } else if (isArray(it)) {
      if (!isArray(oldValue[id])) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it)
      } else {
        testAndUpdateArray(oldValue[id], it, Vue)
      }
    } else { // 简单类型 直接赋值
      if (it !== oldValue[id]) {
        oldValue.splice(id, 1, it)
      }
    }
  })
}
