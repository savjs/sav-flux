import test from 'ava'
import {Flux} from '../src'
import {isFunction} from 'sav-util'

test('flux#api', ava => {
  const flux = new Flux()

  ava.true(isFunction(flux.prop))
  ava.true(isFunction(flux.use))

  ava.true(isFunction(flux.opt))
  ava.true(isFunction(flux.clone))
  ava.true(isFunction(flux.extend))
  ava.true(isFunction(flux.cloneThen))

  ava.true(isFunction(flux.resolve))
  ava.true(isFunction(flux.reject))
  ava.true(isFunction(flux.all))
  ava.true(isFunction(flux.then))

  ava.true(isFunction(flux.commit))
  ava.true(isFunction(flux.dispatch))
  ava.true(isFunction(flux.proxy))
  ava.true(isFunction(flux.declare))

  ava.true(isFunction(flux.getState))
  ava.true(isFunction(flux.updateState))
  ava.true(isFunction(flux.replaceState))
})
