/**
 * test without Proxy function for react-native
 */
import {probe, isFunction} from 'sav-util'

// remove Proxy function
probe.Proxy = false

import test from 'ava'
import {Flux} from '../src'

test('flux no Proxy', ava => {
  const flux = new Flux()

  flux.declare({
    mutations: {
      test () {},
      tst () {}
    },
    actions: {
      test ({resolve}) {
        return resolve(1)
      },
      ts ({resolve}) {
        return resolve(1)
      }
    }
  })

  const { dispatch, commit } = flux

  ava.true(isFunction(dispatch.test))
  ava.true(isFunction(dispatch.ts))
  ava.true(isFunction(dispatch.tst))

  ava.true(isFunction(commit.test))
  ava.true(isFunction(commit.tst))

  dispatch.test().then((ret) => ava.true(ret === 1))
  dispatch.ts().then((ret) => ava.true(ret === 1))
  dispatch.tst().then((ret) => ava.true(ret === undefined))
})
