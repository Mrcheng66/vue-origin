import Dep, { popTarget, pushTarget } from "./dep";

// 1 当我们创建渲染watcher的时候 我们会把当前的渲染watcher 放到Dep.target 上
// 2 调用_render() 会取值 走到get上


// 每个属性都有一个dep（属性就是被观察者）， watcher就是观察者（属性变化了会通知观察者来更新） -》 观察者模式
let id = 0;
class Watcher {
  constructor(vm, expOrFn, options, cb) {
    this.id = id++
    this.vm = vm
    this.renderWatcher = options
    if (typeof expOrFn === 'string') {
      this.getter = function () {
        return vm[expOrFn]
      }
    } else {
      this.getter = expOrFn // geter 意味着调用这个函数可以触发取值操作
    }
    this.deps = [] // 让watcher记住dep也是为了组件卸载和计算属性的实现
    this.depsId = new Set()
    this.cb = cb
    this.lazy = options.lazy // 判断计算属性
    this.dirty = this.lazy // 缓存值，判断更新
    this.value = this.lazy ? undefined : this.get()
    this.user = options.user // 表示是否是用户自己的watcher
  }
  // 判断dirty重新执行
  evaluate() {
    this.value = this.get() // 获取用户函数的返回值，并且还要标记为脏
    this.dirty = false
  }
  get() {
    // Dep.target = this // 静态属性就是只有一份
    pushTarget(this)
    let value = this.getter.call(this.vm) // 会去vm上取值
    // Dep.target = null // 渲染完毕就清空（清空是为了保证只有在模板里面才收集，在vm上获取属性是不收集的）
    popTarget(this)
    return value
  }
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend() // 让计算属性watcher 也收集渲染watcher
    }
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
    if (this.lazy) {
      // 如果是计算属性 依赖的值变化了 就标记计算属性是脏值了
      this.dirty = true  
    } else {
      // this.get() // 重新渲染更新 （不能直接同步更新，多次set值会重复渲染）
      queueWatcher(this)
    }
  }

  run() {
    let oldVal = this.value
    let newVal = this.get()
    if (this.user) {
      this.cb.call(this.vm, newVal, oldVal)
    }
  }
}

let queue = []
let has = {}
let pending = false; // 防抖

function flushSchedulerQueue() {
  let fulshQueue = queue.slice(0)
  queue = []
  has = {}
  pending = false
  fulshQueue.forEach(q => 
    q.run()
  )
}

function queueWatcher(watcher) {
  const id = watcher.id
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true
    // 不管update 执行多少次，只执行一轮刷新操作

    if (!pending) {
      // setTimeout(flushSchedulerQueue, 0) // 不能直接写异步的宏任务，因为异步更新的时候获取不到真实dom数据
      nextTick(flushSchedulerQueue, 0)
      pending = true
    }
  }
}

// nextTick没有直接使用某个api  而是采用优雅降级的方式
// 内部先采用的是Promise （ie不兼容）， 在看MutationObserver ， 
// 还不支持可以考虑 ie专属的 setImmediate 最后 setTimeOut
let callbacks = []
let waiting = false
export function nextTick(cb) { // 先执行内部还是先用户的？
  callbacks.push(cb) // 维护nextTick中的callback方法
  if (!waiting) {
    // setTimeout(() => {
    //   flushCallBacks() // 最后一起刷新
    // }, 0)
    timerFunc()
    waiting = true
  }
}
let timerFunc;
if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallBacks)
  }
} else if (MutationObserver) {
  let observer = new MutationObserver(flushCallBacks)
  let textNode = document.createTextNode(1);
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    textNode.textContent = 2
  }
} else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallBacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallBacks)
  }
}
function flushCallBacks() {
  let cbs = callbacks.slice(0)
  callbacks = []
  waiting = false
  cbs.forEach(cb => cb())
}

// 需要给每个属性增加一个dep  目的就是收集watcher
//  一个组件中 有多个属性 n个属性对应一个视图  n个dep对应一个watcher
// 1个属性对应多个组件(在多个组件引用)  1个dep对应多个watcher
// 多对多的关系

export default Watcher
