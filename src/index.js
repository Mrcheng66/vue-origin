import { initLifeCycle } from "./lifecycle"
import { initMixin } from "./init"
import Watcher, { nextTick } from "./observe/watcher"
import { initGlobalAPI } from "./globalApi"

function Vue(option) {
  this._init(option)
}
Vue.prototype.$nextTick = nextTick
initMixin(Vue)
initLifeCycle(Vue)

initGlobalAPI(Vue)

// watch最终调用的都是这个方法
Vue.prototype.$watch = function (expOrFn, cb, option = {}) {
  console.log(expOrFn, cb);

  new Watcher(this, expOrFn, {user: true}, cb)
}

export default Vue