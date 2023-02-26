import { initMixin } from "./init"

function Vue(option) {
  this._init(option)
}

initMixin(Vue)

export default Vue