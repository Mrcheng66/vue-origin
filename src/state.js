import { observe } from "./observe/index"

export function initState(vm) {
  // 获取所有选项
  const opts = vm.$options

  if (opts.data) {
    initData(vm)
  }

}

function initData(vm) {
  let data = vm.$options.data // data可能是函数或者对象

  data = typeof data === 'function' ? data.call(vm) : data

  // 下面的方法进行了属性 劫持但是在vm实例上并不会有data 属性直接访问 就是不能直接像项目里面 this.** 访问数据， 所以额外定义一个参数
  vm._data = data // 这样又不便于直接的操作， 所以额外设置一层 _data的代理
  // 对数据进行劫持 vue2中采用的是一个Objec.defineProperty
  observe(data)

  // 将vm._data 用vm来代理
  Object.keys(data).forEach(key => proxy(vm, '_data', key))
}

export function proxy(vm, target, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[target][key]
    },
    set(newVal) {
      vm[target][key] = newVal
    }
  })
}
