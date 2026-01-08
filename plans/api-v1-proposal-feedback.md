# API v1 Proposal - Remaining Feedback

_Feedback from critical review to address in future revisions._

---

## Medium Priority

### Organization Improvements

1. **Design Decisions table placement**: Consider moving Part 6 (Design Decisions Summary) to follow the Executive Summary so readers understand major decisions early.

2. **Event Quick Reference placement**: Appendix B is highly useful for implementers but buried at the end. Consider promoting it or creating a separate quick-reference document.

### Clarity Improvements

3. **AG-UI explanation**: The document assumes familiarity with AG-UI. Consider adding a brief inline explanation of what AG-UI is and why it was chosen.

4. **Audience clarity**: Document mixes high-level design with implementation details (DTOs). Consider clarifying intended audience upfront or splitting into separate documents.

---

## Lower Priority

### Redundancy

5. **Streaming examples 4.1-4.3**: Have similar structure. The first example could be more compact, with subsequent examples only showing differences.

6. **Type Alignment Summary (Appendix A)**: Largely repeats information already explained in inline references throughout Part 1.

7. **JSON schema types**: Defined in Part 1 type definitions and again in Appendix C DTOs.

### Technical Clarifications

8. **`TOOL_CALL_ARGS.delta` type**: The streaming examples show string chunks (`delta: "{\"city\":"`) but `ToolUseContent.input` is typed as `Record<string, unknown>`. Clarify that wire format is string chunks but final accumulated type is parsed JSON.

9. **Example 4.6 mixing paradigms**: Uses both AG-UI `STATE_SNAPSHOT`/`STATE_DELTA` and Tambo CUSTOM events. The note says these are alternatives but example uses both - pick one approach.

10. **Continuation request format (Example 4.5)**: Example shows `content` as array matching type but note uses singular "tool results" language. Consider showing multi-tool-result example.

11. **Missing `test` operation in JsonPatchOperation**: RFC 6902 includes `test` operation but our type omits it. Intentional?

12. **InputContent allows ToolResultContent**: But ToolResultContent has role constraints (only valid in user messages after assistant tool_use). This isn't enforced by the type.

### Inconsistencies

13. **Thread vs Run metadata naming**: `CreateThreadWithRunDto` has `threadMetadata` and `runMetadata` but `CreateRunDto` just has `metadata`. Should be consistent.

14. **Timestamp fields**: Some types use `timestamp?: number` (events), others use `createdAt?: string` (messages). Document the format difference explicitly.

15. **`toolUseId` casing**: TypeScript uses `toolUseId` (camelCase) but Anthropic's API uses `tool_use_id` (snake_case). The type definition comment references Anthropic but uses different casing.

### Future Specification Needs

_(Punted for this revision, track for later)_

1. Error code enumeration (what codes can `RUN_ERROR` emit?)
2. Pagination specification details (cursor format, default/max limits)
3. Component state lifecycle documentation
4. Message size limits
5. Project-level MCP tool registration mechanism
6. Rate limiting behavior (how does 429 interact with SSE streams?)
7. Component ID collision handling (what if LLM generates duplicate IDs?)
8. Maximum number of components per message
9. Maximum number of pending tool calls

---

## Questions for Discussion

1. **Should there be a `MESSAGES_SYNC` event?** Currently clients must call `GET /messages` after `RUN_FINISHED` to verify accumulated state. A sync event with final message array would eliminate this need.

2. **Is the streaming-only design correct for all use cases?** Some SDK consumers may want synchronous message creation for simpler integrations. Consider a `stream: false` option that returns complete response.
