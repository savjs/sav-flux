import Vue from 'vue'
import VueRouter from 'vue-router'

import {Flux, FluxVue} from '../../src'

import TodoModule from './todo'
import Todo from './Todo.vue'

Vue.use(FluxVue)

let flux = new Flux({
	strict: true // enable this for promise action to resolve data copy
})
flux.declare(TodoModule)

let router = new VueRouter({
  routes: [
    {
      name: "Todo",
      path: "/",
      component: Todo
    }
  ]
})

let app = new Vue({
	vaf: new FluxVue({
		flux,
    router,
		mixinActions: true
	}),
  router,
	el: '#app'
})

window.flux = flux

export default app
