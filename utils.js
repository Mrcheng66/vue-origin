const strats = {};
  const LIFE_CYCLE = ["beforeCreate", "created"];
  LIFE_CYCLE.forEach((hook) => {
    strats[hook] = function (p, c) {
      if (c) {
        if (p) {
          return p.concat(c);
        } else {
          return [c];
        }
      } else {
        return p;
      }
    };
  });
export function mergeOptions(parent, child) {
  const options = {}
  for (const key in parent) {
    mergeField(key)
  }

  for (const key in child) {
    if (!parent.hasOwnProperty(key)) {
      mergeField(key)
    }
  }

  function mergeField(key) {
    // 策略模式 避免if/else  因为mixin中可能存在多个和组件内同类型的键值的key （created，watch。。。）
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    } else {
      // 优先采用儿子， 再采用父亲
      options[key] = child[key] || parent[key]
    }
  }

  return options
}