import {Flux} from 'hfjy-base/src/flux/flux.js'

import TodoModel from './todoModel'

let flux = new Flux({
	strict: true // enable this for promise action to resolve data copy
})
flux.declare(TodoModel)

import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Switch,
  ScrollView
} from 'react-native'

let features = []

features.push('引擎探测')
features.push('Map:' + typeof Map)
features.push('Proxy:' + typeof Proxy)
features.push('MessageChannel:' + typeof MessageChannel)
features.push('localStorage:' + typeof localStorage)
features.push('XMLHttpRequest:' + typeof XMLHttpRequest)
features.push('MutationObserver:' + typeof MutationObserver)
features.push('window:' + typeof window)
features.push('document:' + typeof document)

export default class TodoView extends Component {
	constructor(props) {
		super(props);
		this.state =  {
			text: '',
			createCount: 0,
			features,
			...flux.getState()
		}
		flux.on('update', (newState)=>this.setState(newState))
		flux.proxy('onCreateNew', ({resolve})=>{
			let newCount = this.state.createCount+ 1
			this.setState({
				createCount: newCount
			})
			return resolve()
		})
	}
	addTodoItem () {
		if (this.state.text) {
			let title = this.state.text
			this.setState({
				text: ''
			})
			flux.dispatch("createNew", title)
		}
	}
	onCheckChange(item) {
		flux.dispatch("toggleCompleted", item)
	}
	removeTodo (item) {
		flux.dispatch("removeItemById", item.id)
	}
	render() {
		const self = this
		return (
	      <View style={{flex:1}} >
	        <Text style={{textAlign:'center', margin: 5}}>React Native Todo Demo (create Count:{this.state.createCount})</Text>
	        <Text>{JSON.stringify(this.state.features, null, 4)}</Text>
	        <View style={{flexDirection: 'row',  margin:5, height:40}}>
				<TextInput 
					style={{flex:1 }}
					onChangeText={(text) => this.setState({text})}
					value={this.state.text} />
				<Button
					style={{flex:1,  margin:5, width:60 }}
					onPress={()=>self.addTodoItem()}
					title="+"
					color="#841584"
				/>
	        </View>
			<ScrollView style={{flex:1 }}>
				{
	                this.state.todoList.map(function (child) {
	                  return (
	                  	<View style={{flex:1, flexDirection: 'row', height: 30, margin:5 }} key={child.id}>
	                  		<Text style={{flex:1}}>{child.title + ' --- ' +child.isCompleted}</Text>
	                  		<Switch
	                  		  style={{flex:1}}
					          onValueChange={(value) => self.onCheckChange(child)}
					          value={child.isCompleted} />
	                  		<Button
	                  		    style={{ borderRadius: 30, height: 24 }}
								onPress={()=>self.removeTodo(child)}
								title="X"
								color="#841584"
							/>
						</View>
	                  );
	                })
	            }
			</ScrollView>
	      </View>
		);
	}
};
