import { useState, useEffect, RefObject, MutableRefObject } from "react";

const useIntersection = <T extends Element>(
  elementRef: RefObject<T>,
  rootMargin: `${number}px`
) => {
  const [isVisible, setState] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setState(entry.isIntersecting);
      },
      { rootMargin }
    );

    elementRef.current && observer.observe(elementRef.current);

    return () => observer.unobserve(elementRef.current!);
  }, [elementRef, rootMargin]);

  return isVisible;
};

export default useIntersection;
