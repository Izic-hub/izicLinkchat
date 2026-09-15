import { useEffect, useRef } from "react";

/** Attach the returned ref to a dropdown/menu/popover element. Calls
 *  onOutside when the user clicks or taps anywhere else. */
export function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [onOutside]);
  return ref;
}
