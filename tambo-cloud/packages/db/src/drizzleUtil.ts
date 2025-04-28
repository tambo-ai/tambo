// from https://orm.drizzle.team/docs/custom-types

import { sql } from "drizzle-orm";
import { customType, PgColumn } from "drizzle-orm/pg-core";
import { deserialize, type serialize, stringify } from "superjson";

type SuperJSONResult = ReturnType<typeof serialize>;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export const customJsonb = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return "jsonb";
    },
    toDriver(value: TData): string {
      return stringify(value);
    },
    /** Database -> TypeScript */
    fromDriver(valueStr: string | object | SuperJSONResult | null): TData {
      if (typeof valueStr === "string") {
        // hack: incorrect!
        return valueStr as TData;
      }
      if (!valueStr) {
        return valueStr as TData;
      }
      if ("json" in valueStr) {
        return deserialize<TData>(valueStr);
      }
      return valueStr as TData;
    },
  })(name);

/**
 * Generates a SQL expression that merges a JSON value into the given column,
 * while preserving the SuperJSON format.
 *
 * This is functionally equivalent to this JS:
 * ```js
 * const merged = {
 *   ...columnValue,
 *   ...newPartialState,
 * };
 * ```
 *
 * */
export function mergeSuperJson(
  column: PgColumn,
  newPartialState: Record<string, unknown>,
) {
  const newPartialStateJsonb = stringify(newPartialState);
  return sql`
        jsonb_build_object(
          'json',
          (
            COALESCE(
              (${column}->>'json')::jsonb,
              '{}'::jsonb
            ) || 
            (${newPartialStateJsonb}::json->>'json')::jsonb
          ),
          'meta',
          jsonb_build_object(
            'values',
            (
              COALESCE(
                (${column} #>> '{meta, values}')::jsonb,
                '{}'::jsonb
              ) || 
              (${newPartialStateJsonb}::json #>> '{meta, values}')::jsonb
            ),
            'referentialEqualities',
            (
              COALESCE(
                (${column} #>> '{meta, referentialEqualities}')::jsonb,
                '{}'::jsonb
              ) || 
              (${newPartialStateJsonb}::json #>> '{meta, referentialEqualities}')::jsonb
            )
          )
        )
      `;
}
