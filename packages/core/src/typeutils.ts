/**
 * Gets the union of all possible keys in a union type U.
 * This is useful when you want to get all possible keys that could exist in any member of the union.
 * @template U The union type to extract keys from
 */
type AllKeys<U> = U extends unknown ? keyof U : never;

/**
 * Gets the property type for a given key K in a union type U.
 * This extracts the type of the property K from each member of the union where it exists.
 * @template U The union type to extract the property from
 * @template K The key to look up in each member of the union
 */
type PropType<U, K extends PropertyKey> =
  U extends Record<K, infer V> ? V : never;

/**
 * Extracts keys that are required (present in every member) from a union type U.
 * A key is considered required if it exists in every member of the union.
 * The resulting type will have all required keys with their corresponding types.
 * @template U The union type to extract required keys from
 */
type RequiredKeys<U> = {
  [K in AllKeys<U> as [U] extends [Record<K, unknown>] ? K : never]: PropType<
    U,
    K
  >;
};

/**
 * Extracts keys that are optional (not present in every member) from a union type U.
 * A key is considered optional if it exists in some but not all members of the union.
 * The resulting type will have all optional keys marked with ? and their corresponding types.
 * @template U The union type to extract optional keys from
 */
type OptionalKeys<U> = {
  [K in AllKeys<U> as [U] extends [Record<K, unknown>] ? never : K]?: PropType<
    U,
    K
  >;
};

/**
 * Combines required and optional keys from a union type into a single type.
 * This creates a new type that has all the required keys from RequiredKeys
 * and all the optional keys from OptionalKeys.
 * Useful for converting a union of types into a single type with optional properties.
 * @template U The union type to combine keys from
 */
export type CombineUnion<U> = RequiredKeys<U> & OptionalKeys<U>;

/**
 * Extracts string literals from a union type, e.g.
 * "foo" | "bar" | "baz" | string -> "foo" | "bar" | "baz"
 *
 * @template T The union type to extract string literals from
 * @returns A new type that has only the string literals from the union
 */
export type NarrowStrings<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;
