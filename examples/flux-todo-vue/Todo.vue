<template>
	<div class="todolist">
		<h4>TODO LIST<i>(create times {{count}})</i></h4>
		<ul>
			<li v-for="child in todoList">
          		<label>
              		<input type="checkbox" :checked="child.isCompleted" @change="toggleCompleted(child)"/>
              		<span>{{child.title}}</span>
          		</label>
              	<button @click="removeItemById(child.id)">x</button>
			</li>
		</ul>
		<input type="text" v-model="newText"/> <button @click="createNew(newText)">Add</button>
	</div>
</template>

<script type="text/javascript">
	import {mapGetters } from '../../src'

	export default {
		computed: mapGetters([
			'todoList'
		]),
		data: function () {
			return {
				newText: '',
				count: 0
			}
		},
		payload ({dispatch}) {
			return dispatch('restoreItems', [{
				title: 'payload-todo',
				id: 1,
				isCompleted: true
			}])
		},
		proxys: {
			onCreateNew ({resolve}, item) {
				this.count++
				return resolve('ok')
			}
		}
	}
</script>