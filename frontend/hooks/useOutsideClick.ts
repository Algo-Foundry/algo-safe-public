/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";

export const useOutsideClick = (callback: () => void) => {
  const ref = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [ref]);

  return ref;
};
