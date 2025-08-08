import React from 'react';

/**
 * Hàm helper để import các components một cách lazy với React.lazy và dynamic import
 * @param factory - Hàm import động
 * @returns Lazy component với React.Suspense
 */
export function lazyImport<
  T extends React.ComponentType<any>,
  I extends Record<K, T>,
  K extends keyof I
>(factory: () => Promise<I>, name: K): Pick<I, K> {
  return {
    [name]: React.lazy(() => factory().then((module) => ({ default: module[name] }))),
  } as Pick<I, K>;
}

/**
 * Hàm helper để tạo lazy component với loading fallback
 * @param importFunc - Hàm import động
 * @param fallback - Component hiển thị trong khi loading
 * @returns Lazy component đã được bọc trong Suspense
 */
export function lazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ReactNode = null
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return React.createElement(
      React.Suspense,
      { fallback },
      React.createElement(LazyComponent, props)
    );
  };
}

/**
 * HOC để tạo lazy route component với loading fallback
 * @param importFunc - Hàm import động
 * @returns Lazy route component
 */
export function lazyRoute<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFunc);
  
  return function LazyRouteWrapper(props: React.ComponentProps<T>) {
    const fallback = React.createElement(
      'div',
      { className: "flex items-center justify-center min-h-screen" },
      React.createElement(
        'div',
        { className: "w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" }
      )
    );
    
    return React.createElement(
      React.Suspense,
      { fallback },
      React.createElement(LazyComponent, props)
    );
  };
}