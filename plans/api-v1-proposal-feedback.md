# API v1 Proposal - Remaining Feedback

_Feedback from critical review to address in future revisions._

**Maintenance:** Remove items from this file as they are addressed. Do not add "addressed" sections.

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

### Technical Clarifications

1. **InputContent allows ToolResultContent**: But ToolResultContent has role constraints (only valid in user messages after assistant tool_use). This isn't enforced by the type.

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
