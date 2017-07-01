<todo>
  <div class="todolist">
    <h4>TODO LIST<i>(create times {count})</i></h4>
    <ul>
      <li each={child in todoList}>
        <label>
            <input type="checkbox" checked={ child.isCompleted } onclick={toggleCompleted.bind(this, child)} />
            <span>{child.title}</span>
        </label>
          <button onclick= { removeItemById.bind(this, child.id) }>x</button>
      </li>
    </ul>
    <input type="text" ref="newText"/>
    <button onclick={createNewTodo}>Add</button>
  </div>
  <script>
    this.count = 0
    this.getters = ['todoList']
    this.actions = ['createNew', 'toggleCompleted', 'removeItemById']
    this.createNewTodo = (e) => {
      this.createNew(this.refs.newText.value).then(() => {
        this.count++
      })
    }
  </script>
</todo>
