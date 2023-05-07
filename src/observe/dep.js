let id = 0
class Dep {
  // 属性的dep要收集watcher
  constructor() {
    this.id = id++; // 属性dep要收集watcher
    this.subs = []; // 这里存放这当前属性对应的watcher 有哪些
  }
  depend() {
    // this.subs.push(Dep.target) // 这里我们不希望放重复的watcher，而且方才只是一个单向的关系
    //（因为可能在模板中多次使用同一属性， 没有必要多次收集watcher）
    // dep -> watcher (watcher 记录dep)
    
    Dep.target.addDep(this) // Dep.target 这个是watcher 哦, 就是让watcher记住dep了
    
    // dep 和 watcher 是一个多对多的关系（一个属性可以在多个组件中使用 dep -》 多个watcher）
    // 一个组件中由多个属性组成（一个watcher -》 对应多个dep）
  }

  addSub(watcher) {
    this.subs.push(watcher)
  }

  notify() {
    this.subs.forEach(wathcer => {
      wathcer.update()
    })
  }
}

Dep.target = null

let stack = []
export function pushTarget(watcher) {
  stack.push(watcher)
  Dep.target = watcher
}

export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length - 1]
}

export default Dep
