import { initLifeCycle } from "./lifecycle"
import { initMixin } from "./init"
import { nextTick } from "./observe/watcher"
import { initGlobalAPI } from "../globalApi"

function Vue(option) {
  this._init(option)
}
Vue.prototype.$nextTick = nextTick
initMixin(Vue)
initLifeCycle(Vue)

initGlobalAPI(Vue)

export default Vue