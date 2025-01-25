// from https://orm.drizzle.team/docs/custom-types

import { customType } from "drizzle-orm/pg-core";
import { deserialize, stringify, SuperJSONResult } from "superjson";

export const customJsonb = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return "jsonb";
    },
    toDriver(value: TData): string {
      return stringify(value);
    },
    /** Database -> TypeScript */
    fromDriver(valueStr: string | object | SuperJSONResult): TData {
      if (typeof valueStr === "string") {
        // hack: incorrect!
        return valueStr as TData;
      }
      if (!valueStr) {
        return valueStr;
      }
      if ("json" in valueStr) {
        return deserialize<TData>(valueStr);
      }
      return valueStr as TData;
    },
  })(name);
