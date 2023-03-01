import { initLifeCycle } from "./lifecycle"
import { initMixin } from "./init"

function Vue(option) {
  this._init(option)
}

initMixin(Vue)
initLifeCycle(Vue)

export default Vue