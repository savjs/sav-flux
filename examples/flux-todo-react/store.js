import {Flux, FluxRedux} from '../../src'

import TodoModule from './todo'

let flux = new Flux({
	strict: true // enable this for promise action to resolve data copy
})
flux.declare(TodoModule)

export default new FluxRedux({flux})
