import { z } from "zodInternalAlias";

/*
 * # Why "zodInternalAlias"?
 *
 * We use a custom alias for the zod package because we want to use zod for
 * schema parsing/validation, but we also want to use the _types_ from the
 * user-installed version of zod which could be either 3 or 4. By using an
 * alias, we can ensure that these schemas use our version of zod (v4.1), but
 * the user can use their own version elsewhere in their project without type
 * conflicts and sometimes circular dependencies.
 */

export { z };
