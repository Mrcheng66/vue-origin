import Dep from "./dep";

// 1 当我们创建渲染watcher的时候 我们会把当前的渲染watcher 放到Dep.target 上
// 2 调用_render() 会取值 走到get上


// 每个属性都有一个dep（属性就是被观察者）， watcher就是观察者（属性变化了会通知观察者来更新） -》 观察者模式
let id = 0;
class Watcher {
  constructor(vm, callback, options) {
    this.id = id++
    this.vm = vm
    this.renderWatcher = options
    this.getter = callback // geter 意味着调用这个函数可以触发取值操作
    this.deps = [] // 让watcher记住dep也是为了组件卸载和计算属性的实现
    this.depsId = new Set()
    this.get()
  }

  get() {
    Dep.target = this // 静态属性就是只有一份
    this.getter() // 会去vm上取值
    Dep.target = null // 渲染完毕就清空（清空是为了保证只有在模板里面才收集，在vm上获取属性是不收集的）
  }

  addDep(dep) {
    let id = dep.id
    if(!this.depsId.has(id)) {
      this.deps.push(dep)
      this.depsId.add(id)
      dep.addSub(this); // watcher记住了dep了而且去重了, 此时dep 也记住watcher了
    }
  }

  update() {
    this.get() // 重新渲染更新
  }
}

// 需要给每个属性增加一个dep  目的就是收集watcher
//  一个组件中 有多个属性 n个属性对应一个视图  n个dep对应一个watcher
// 1个属性对应多个组件(在多个组件引用)  1个dep对应多个watcher
// 多对多的关系

export default Watcher
