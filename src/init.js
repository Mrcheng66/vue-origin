
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    console.log(this);

    const vm = this
    vm.$options = options
    // 初始化状态
    initState(vm)
  }
}

function initState(vm) {
  const options = vm.$options

  if (options.data) {
    initData(vm)
  }

}

function initData(vm) {
  
  if (typeof vm !== 'object' || vm === null) return 
}