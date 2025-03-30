import { initLifeCycle } from "./lifecycle"
import { initMixin } from "./init"
import { initGlobalAPI } from "./globalApi"
import { initStateMixin } from "./state"
function Vue(option) {
  this._init(option)
}
initMixin(Vue)
initLifeCycle(Vue)
initGlobalAPI(Vue)
initStateMixin(Vue)


export default Vue