import { mergeOptions } from "./utils";

export function initGlobalAPI(Vue) {
  // 静态属性
  Vue.options = {};
  
  Vue.mixin = function (mixin) {
    // 我们期望将用户的选项和 全局API进行合并
    // {} {created: function(){}} => {created: [fn()]}

    this.options = mergeOptions(this.options, mixin);

    return this;
  };
}
