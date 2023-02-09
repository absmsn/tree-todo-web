export class Lazy {
  fn = null;
  value = null;
  executed = false;

  constructor(fn) {
    this.fn = fn;
    return new Proxy(this, {
      get(obj, key) {
        if (obj.fn && !obj.executed) {
          obj.value = obj.fn();
          obj.executed = true;          
        }
        return obj.value[key];
      },
      set(obj, key, value) {
        obj.value[key] = value;
	    }
    });
  }
}