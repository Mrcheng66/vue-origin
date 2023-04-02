import { newArrayProto } from "./array";
import Dep from "./dep";

export function observe(data) {
  // 劫持数据
  // console.log(data);

  // 只对对象进行劫持
  if (typeof data !== 'object' || data === null) return

  // 说明这个对象被代理过了
  if (data.__ob__ instanceof Observer) {
    return data.__ob__;
  } 
  // 如果一个对象被劫持过了， 那就不需要劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
  return new Observer(data)
  
}
class Observer {
  constructor(data) {
    // 给每个对象都新增收集功能
    this.dep = new Dep()

    // object.definerProperty 只能劫持已经存在的数据，新增的和删除的并不能感知。
    // vue2 里面会为此单独设置$set $delete
    // data.__ob__ = this // 给数据加了一个标识，如果数据上有__ob__则说明这个属性被观测过
    // (但是直接放在这里会栈内存溢出，因为下面还有walk函数循环， 下面有个observe递归)
    // 所以将__ob__ 转换成不可枚举
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false // 将__ob__转换为不可枚举（循环的时候无法获取）
    })

    // 但是针对data中的数组数据每一项都添加get(), set() 性能太差了， 且不能监听到数组的push, pop 等方法
    if (Array.isArray(data)) {
      // 所以在这里我们重写数组中的方法 七个变异方法是可以修改数组本身的
      data.__proto__ = newArrayProto
      this.observeArray(data) // 如果数组中放的是对象的时候
    } else {
      this.walk(data)
    }
  }

  walk(data) {
    // 循环对象 对属性依次劫持
    // 重写定义属性 性能差
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }

  observeArray(data) { // 观测数组中的对象数据
    data.forEach(item => observe(item))
  }
}

// 深层次嵌套会递归，递归多了性能就差，不存在属性监听不到，存在的属性要重写方法
function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    const current = value[i];
    current.__ob__ &&  current.__ob__.dep.depend() // 
    if (Array.isArray(current)) {
      dependArray(current )
    }
  }
}

export function defineReactive(target, key, value) { // 闭包 属性劫持
  const childOb = observe(value)  // 递归， 比如data中的属性还是一个对象的场景,   childOb.dep用来收集依赖的
  let dep = new Dep() // 怎么讲dep和watcher关联起来呢？
  // (默认会在渲染的时候创建一个watcher， 会将这个watcher 放在Dep全局静态属性target上)，之后执行_render
  // 去取值， 让当前的dep记住当前的watcher
  Object.defineProperty(target, key, {
    get() {
      if (Dep.target) {
        dep.depend(); // 让这个属性的收集器记住这个watcher

        if (childOb) {
          childOb.dep.depend()

          if (Array.isArray(value)) { // 如果劫持数组中还有数组的场景
            dependArray(value)
          }
        }
      }
      // 取值的时候会执行get
      return value
    },
    set(newVal) {
      // 修改的时候会执行
      if (newVal === value) return
      observe(newVal)
      value = newVal
      dep.notify() // 通知更新
    }
  })
}
