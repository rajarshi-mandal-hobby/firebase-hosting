// Utility exports
export * from './memberUtils.ts';
export * from './dateUtils.ts';
export * from './statusUtils.tsx'

/**
 * A utility type that makes all properties of a given type T optional, including nested properties.
 * This is useful for scenarios where you want to create a partial version of a complex object type.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};