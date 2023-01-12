import { useEffect, useCallback, useRef, useState } from "react";

export function useThrottle(fn, delay, dep = []) {
  const { current } = useRef({ fn, timer: null });
  useEffect(function () {
    current.fn = fn;
  }, [fn]);

  return useCallback(function f(...args) {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        delete current.timer;
      }, delay);
      current.fn(...args);
    }
  }, dep);
}

export function useDebounce(fn, delay, dep = []) {
  const { current } = useRef({ fn, timer: null });
  useEffect(function () {
    current.fn = fn;
  }, [fn]);

  return useCallback(function f(...args) {
    if (current.timer) {
      clearTimeout(current.timer);
    }
    current.timer = setTimeout(() => {
      current.fn(...args);
    }, delay);
  }, dep)
}

export function usePortal(refCb) {
  const domRef = useRef(document.createElement("div"));

  useEffect(() => {
    if (refCb) {
      refCb.call(domRef);
    } else {
      domRef.current.style.position = "absolute";
      domRef.current.style.left = 0;
      domRef.current.style.top = 0;
    }
    document.body.appendChild(domRef.current);
    return (() => {
      document.body.removeChild(domRef.current);
    });
  }, []);
  return domRef;
}

export function useSyncProp(prop) {
  const [state, setState] = useState(prop);
  useEffect(() => setState(prop), [prop]);
  return [state, setState];
}