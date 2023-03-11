import { initLifeCycle } from "./lifecycle"
import { initMixin } from "./init"
import { nextTick } from "./observe/watcher"

function Vue(option) {
  this._init(option)
}
Vue.prototype.$nextTick = nextTick
initMixin(Vue)
initLifeCycle(Vue)

export default Vue