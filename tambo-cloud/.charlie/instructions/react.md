## React APIs

- Avoid excessive use of `useEffect` hooks
- Avoid excessive use of `useMemo` - only use it when it will save a re-render, that is use it when creating objects but try to avoid using it for primitive values.
- Use `useCallback` when you need to memoize a function, especially when passing it to children components.
- Use the `useState` hook for state that is local to the component, but try to use it as just a way to cache a value.

## React Types

- Use the `FC` type for functional components.
- Use the `PropsWithChildren` type for components that accept children.
- Use the `ComponentProps` type for components that accept props.
- Use the `ComponentPropsWithRef` type for components that accept props and a ref.
- Use the `ComponentPropsWithoutRef` type for components that accept props without a ref.

## React patterns

- Try to reuse existing components and hooks when possible.
- Do not use default exports to export a component from a single file. Consumers should import the component directly with named imports.
- Do not create example or showcase components unless it is part of the product's UI.

## Layout and styling

Use flexbox for layout using Tailwind's flex utilities like `flex` and `flex-col`/`flex-row` classes.

- Make use of `gap-{size}` classes to manage most spacing, even when using related utilities like `justify-{value}` or `items-{value}`. Parents should dictate spacing between children.
- When an element needs to provide spacing, use `p-{size}` padding utilities, because elements should only be responsible for their own spacing within their own border box.
- Avoid using margin utilities (`m-{size}`)
- Use minimal custom CSS properties, preferring Tailwind's utility classes.
- Use the minimal amount of Tailwind classes to style components.
- For overflowing text, use css to truncate the text with ellipsis (`text-ellipsis`)

When flexbox is not enough, use Tailwind's grid utilities like `grid` and `grid-cols-{n}`.

Use semantic HTML elements with Tailwind's typography classes like `text-{size}` for any user-facing text.
