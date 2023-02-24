import { initMixin } from "./init"

function Vue(option) {
  this._init(option)
  // this.age = '2323'
}

initMixin(Vue)

export default Vue