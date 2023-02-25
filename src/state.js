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
  // 对数据进行劫持 vue2中采用的是一个Objec.defineProperty
  observe(data)
}