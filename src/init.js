import { initState } from "./state";

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    console.log(this); // 这里的this都是实例
    // vm.$options就是获取用户的配置选项
    const vm = this
    vm.$options = options // 将用户的选项挂载到实例上
    // 初始化状态
    initState(vm)
  }
}

