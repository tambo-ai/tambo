# API v1 Proposal - Remaining Feedback

_Feedback from critical review to address in future revisions._

## Medium Priority

### Organization Improvements

1. **Design Decisions table placement**: Consider moving Part 6 (Design Decisions Summary) to follow the Executive Summary so readers understand major decisions early.

2. **Open Questions format**: Part 7 is verbose (~50-60 lines per option). Consider:
   - Leading with a brief summary table of options and tradeoffs
   - Moving detailed prose to sub-sections or a separate appendix

3. **Event Quick Reference placement**: Appendix B is highly useful for implementers but buried at the end. Consider promoting it or creating a separate quick-reference document.

### Clarity Improvements

1. **AG-UI explanation**: The document assumes familiarity with AG-UI. Consider adding a brief inline explanation of what AG-UI is.

2. **Audience clarity**: Document mixes high-level design with implementation details. Consider clarifying intended audience upfront.

3. **"First-class Components" terminology**: The phrase "special tool calls with streaming props/state" is confusing since components are structurally different from tool calls.

4. **`contextTools` undefined**: The term appears in `AvailableComponent` interface but is never explained. What makes a tool "context-specific"?

## Lower Priority

### Redundancy

1. **Streaming examples 4.1-4.3**: Have similar structure. The first example could be more compact, with subsequent examples only showing differences.

2. **Type Alignment Summary (Appendix A)**: Largely repeats information already explained in inline references throughout Part 1.

3. **JSON schema types**: Defined in Part 1 type definitions and again in Appendix C DTOs.

4. **Design Note duplication**: The explanation for "image/audio/file vs resource" at lines 129-144 is repeated conceptually in section 7.2.

### Technical Clarifications

1. **`ToolCall.arguments` type**: Typed as `Record<string, unknown>` (parsed) but streaming examples show string deltas. Clarify that wire format is string chunks but final accumulated type is parsed JSON.

2. **Example 4.6 mixing**: Uses both AG-UI `STATE_SNAPSHOT`/`STATE_DELTA` and Tambo CUSTOM events. The note says these are alternatives but example uses both - confusing.

3. **Continuation request format inconsistency**: Example shows `content` as string but `InputMessage` defines `content: InputContent[]`.

### Future Specification Needs

_(Punted for this revision, track for later)_

1. Error code enumeration
2. Pagination specification details (cursor format, default/max limits)
3. Run state machine formal definition
4. Component state lifecycle documentation
5. Message size limits
6. Reconnection timeout/buffer behavior
7. Project-level MCP tool registration mechanism
