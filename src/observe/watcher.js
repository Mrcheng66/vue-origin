let id = 0;
class Watcher {
  constructor(vm, callback, options) {
    this.id = id++
    this.vm = vm
    this.renderWatcher = options
    this.getter = callback // geter 意味着调用这个函数可以触发取值操作

    this.get()
  }

  get() {
    this.getter()
  }
}

// 需要给每个属性增加一个dep  目的就是收集watcher
//  一个组件中 有多个属性 n个属性对应一个视图  n个dep对应一个watcher
// 1个属性对应多个组件(在多个组件引用)  1个dep对应多个watcher
// 多对多的关系

export default Watcher
