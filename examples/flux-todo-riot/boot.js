import {Flux, FluxRiot} from '../../src/'
import riot from 'riot/riot+compiler'

let _startIdx = 0

let todoModule = {
  state: {
    todoList: [],
  },
  mutations: {
    createNew ({state: {todoList}}, newItem) {
      todoList.push(newItem)
      return { todoList }
    },
    toggleCompleted ({state: {todoList}}, todo) {
      for (let i= 0, l = todoList.length; i < l ; ++ i) {
        if (todoList[i].id == todo.id) {
          let it = todoList[i];
          if (it.isCompleted == todo.isCompleted) {
            it.isCompleted = !todo.isCompleted;
            return { todoList }
          }
        }
      }
    },
    removeItemById ({state: {todoList}}, id) {
      for (let i= todoList.length -1; i >=0 ; --i) {
        if (todoList[i].id == id) {
          todoList.splice(i, 1)
          return { todoList }
        }
      }
    },
  },
  actions: {
    createNew ({resolve, commit, dispatch}, title) {
      let newItem = {}
      newItem.title = title
      newItem.id = ++ _startIdx 
      newItem.isCompleted = false
      commit.createNew(newItem)
    },
  }
}

let flux = new Flux({
  strict: true
})

flux.declare(todoModule)

FluxRiot({flux, riot})

console.log(riot)

riot.compile(function() {
  riot.mount('*')
})

window.riot = riot
window.flux = flux
