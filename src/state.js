import { observe } from "./observe/index";
import Watcher from "./observe/watcher";
import Dep from "./observe/dep";
export function initState(vm) {
  // 获取所有选项
  const opts = vm.$options;
  if (opts.data) {
    // 数据
    initData(vm);
  }
  if (opts.computed) {
    // 计算属性
    initComputed(vm);
  }
}

function initData(vm) {
  let data = vm.$options.data; // data可能是函数或者对象

  data = typeof data === "function" ? data.call(vm) : data;

  // 下面的方法进行了属性 劫持但是在vm实例上并不会有data 属性直接访问 就是不能直接像项目里面 this.** 访问数据， 所以额外定义一个参数
  vm._data = data; // 这样又不便于直接的操作， 所以额外设置一层 _data的代理
  // 对数据进行劫持 vue2中采用的是一个Objec.defineProperty
  observe(data);

  // 将vm._data 用vm来代理
  Object.keys(data).forEach((key) => proxy(vm, "_data", key));
}

export function proxy(vm, target, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[target][key];
    },
    set(newVal) {
      vm[target][key] = newVal;
    },
  });
}

function initComputed(vm) {
  const computed = vm.$options.computed;
  const watcher = vm._computedWatchers = {}
  for (const key in computed) {
    if (Object.hasOwnProperty.call(computed, key)) {
      const useDef = computed[key];
      
      // 我们需要监控 计算属性中get的变化
      const fn = typeof useDef === "function" ? useDef : useDef.get;
      // 如果直接new Watcher 默认就会执行fn， 所以在options中增加一个标识lazy
      // 将属性和watcher对应起来
      watcher[key] = new Watcher(vm, fn, {lazy: true})

      defineComputed(vm, key, useDef);
    }
  }
}

function defineComputed(target, key, useDef) {
  const getter = typeof useDef === "function" ? useDef : useDef.get;
  const setter = useDef.set || (() => {});
  // console.log(getter, setter);
  Object.defineProperty(target, key, {
    get: creatComputedGetter(key),
    set: setter,
  });
}

// 计算属性根本不会收集依赖，只会让自己的依赖属性去收集依赖
function creatComputedGetter(key) {
  // 我们需要监测是否要执行这个getter
  return function () {
    const watcher = this._computedWatchers[key] // 获取对应属性的watcher
    if (watcher.dirty) {
      // 如果是脏的就去执行用户传入的函数
      watcher.evaluate() // 直接掉get不合适因为存在值变化重新执行的情况
    }
    if (Dep.target) { // 计算属性出栈后 还要渲染watcher  我应该让计算属性watcher里面的属性也去收集上层watcher（渲染watcher）
        watcher.depend()      
    }
    return watcher.value // 最后返回的是watcher上的值
  }
}
