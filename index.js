const PARENT = "$parent";
const PARENTS = "$parents";
const THIS = "$this";
const CONTEXTUAL = "$contextual";

function handler(contextual, parent) {
  return {
    get(target, key) {
      if (key === PARENT) return parent;
      if (key === PARENTS) {
        if (parent) {
          const grandParents = Reflect.get(parent, PARENTS);
          if (Array.isArray(grandParents)) {
            return [parent, ...grandParents];
          }
          return [parent];
        }
        return [];
      }
      if (key === CONTEXTUAL) return contextual;
      // $this means the wrapped target, not current proxy.
      if (key === THIS) return target;
      if (Reflect.has(contextual, key)) return Reflect.get(contextual, key);
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (parent) return Reflect.get(parent, key);
    },
    has(target, key) {
      if (key === PARENT) return !!parent;
      if (key === PARENTS) return true;
      if (key === CONTEXTUAL) return true;
      // $this means the wrapped target, not current proxy.
      if (key === THIS) return !!target;
      if (Reflect.has(contextual, key) || Reflect.has(target, key)) return true;
      if (parent) return Reflect.has(parent, key);
      return false;
    },
    set(target, key, value) {
      // $parent, $parents, $this and $contextual are not assignable.
      // return TypeError in strict mode
      if (key === PARENT || key === PARENTS || key === THIS || key === CONTEXTUAL) {
        return false;
      }
      if (Reflect.has(contextual, key)) return Reflect.set(contextual, key, value);
      if (Reflect.has(target, key)) return Reflect.set(target, key, value);
      // Create a new contextual variable, never mutate contextual variable of parent.
      if (key.startsWith("$")) return Reflect.set(contextual, key, value);
      // Only mutate existing property in parent chain.
      if (parent && Reflect.has(parent, key, value)) return Reflect.set(parent, key, value);
      // Add new property to the target object.
      return Reflect.set(target, key, value);
    }
  };
}

// Proxy class can not be extended (Proxy is special because of no prototype),
// so we have to use a factory method here.
// Contextual Proxy is a proxy with access to parent object(s) through $parent
// and $parents.
// There is also contextual variables like $foo and $index. By convention, all
// contextual variable names start with "$", but this is not a hard requirement.
function proxy(
  target,
  // parent can be any object,
  // if parent is another contextual proxy (made from proxy(...)),
  // it can support the chain of contextual proxy.
  parent = undefined,
  // contextual variables.
  contextual = {},
) {
  return new Proxy(target, handler(contextual, parent));
}

exports.default = proxy;
exports.__esModule = true;
