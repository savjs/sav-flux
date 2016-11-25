import Vue from 'vue'
import {Flux, FluxVue} from '../../src'

import TodoModule from './todo'
import Todo from './Todo.vue'

Vue.use(FluxVue)

let flux = new Flux({
	strict: true // enable this for promise action to resolve data copy
})
flux.declare(TodoModule)

let app = new Vue({
	vaf: new FluxVue({
		flux,
		mixinActions: true
	}),
	el: '#app',
	...Todo
})