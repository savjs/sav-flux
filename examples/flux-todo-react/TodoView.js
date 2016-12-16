import React from 'react'
import {connect} from 'react-redux'

@connect(state => state, dispatch => dispatch)
class TodoView extends React.Component {
	constructor(props) {
		super(props);
		this.addTodo = this.addTodo.bind(this)
		this.addTodo100 = this.addTodo100.bind(this)
	}
	addTodo () {
		var val = this.refs.newInput.value;
		if (val) {
			this.props.dispatch.createNew(val)
		}
	}
	addTodo100 () {
		var val = this.refs.newInput.value;
		if (val) {
			for( var i=0; i< 100; ++i) {
				this.props.dispatch('createNew', val + i);
			}
		}
	}
	render () {
		const {dispatch} = this.props
		return (
			<div>
				<h1>Todo</h1>
				<input type="text" ref="newInput"/>
				<button onClick={this.addTodo}>Add</button>
				<button onClick={this.addTodo100}>Add 100</button>
          <ol>
            {
              this.props.todoList.map(function (child) {
                return (
                	<li key={child.id}>
                		<label>
                  		<input type="checkbox" 
                  			data-id={child.id}
                  			checked={child.isCompleted}
  								onChange={()=>dispatch.toggleCompleted(child)}
                  		/>
                  		<span>{child.title}</span>
                		</label>
                  	<button onClick={()=>dispatch.removeItemById(child.id)}>x</button>
                	</li>
                );
              })
            }
          </ol>
			</div>
		);
	}
}

export {TodoView}