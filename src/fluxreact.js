export class FluxRedux {
  constructor ({flux}) {
    this.flux = flux
    this.dispatch = flux.dispatch
    this.state = flux.getState()
    flux.on('update', this.watchUpdate = (newState) => {
      this.state = Object.assign({}, this.state, newState)
      flux.emit('redux_change')
    })
    flux.on('replace', this.watchReplace = (newState) => {
      this.state = newState
      flux.emit('redux_change')
    })
  }
  getState () {
    return this.state
  }
  subscribe (fn) {
    return this.flux.subscribe('redux_change', fn)
  }
}
