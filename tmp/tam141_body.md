Closes TAM-141

This PR refactors the ThreadContent component used in both the CLI and the Showcase site to improve readability and layout consistency.

### What’s changed
- **Full-width layout**: `w-full` applied to ThreadContent and ThreadContentMessages so they always span the container.
- **User message alignment**: User messages are now right-aligned with `justify-end` and capped at `max-w-3xl` to keep readable line-lengths.
- **Assistant message alignment**: Assistant messages remain left-aligned (`justify-start`) and continue to fill available width.
- **Consistent conditional logic**: Alignment logic is centralised through the `cn` utility for cleaner, more maintainable class composition.
- **Utility clean-up**: All runtime class concatenation now leverages the shared `cn` helper.

### Files updated
- `showcase/src/components/ui/thread-content.tsx`
- `cli/src/registry/thread-content/thread-content.tsx`

Linear issue → https://linear.app/tambo/issue/TAM-141/feat-improve-threadcontent-component-in-the-cli-and-the-showcase-site
