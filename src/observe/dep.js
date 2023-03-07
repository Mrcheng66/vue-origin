let id = 0
class Dep {
  // 属性的dep要收集watcher
  constructor() {
    this.id = id++; // 属性dep要收集watcher
    this.subs = []; // 这里存放这当前属性对应的watcher 有哪些
  }
}

export default Dep
