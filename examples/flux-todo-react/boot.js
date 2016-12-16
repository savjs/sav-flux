import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'

import store from './store'
import {TodoView} from './TodoView.js'

ReactDOM.render(
  <Provider store = {store} >
    <TodoView />
  </Provider>, 
document.querySelector('#app'))
