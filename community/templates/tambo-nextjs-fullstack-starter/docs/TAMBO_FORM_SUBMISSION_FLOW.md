# Tambo Form Submission Flow

This document explains the step-by-step process that Tambo uses when a user submits the AddUserForm to add data to the users table.

## Complete Flow Diagram

```
User Action → Form Validation → API Call → Database Transaction → AI Feedback → Table Refresh → Form Reset
```

## Detailed Step-by-Step Process

### Phase 1: User Interaction & Form Submission

**Step 1.1: User Fills Out Form**

- User enters data in the `AddUserForm` component:
  - Email (required)
  - Name (optional, placeholder: "user.name")
  - Post Title (required)
  - Post Content (optional)
  - Published checkbox (true/false)

**Step 1.2: User Clicks Submit Button**

- Form's `handleSubmit` function is triggered
- `isSubmitting` state is set to `true` (disables form fields)
- Previous errors are cleared

### Phase 2: Client-Side Validation

**Step 2.1: Email Validation**

```typescript
// Location: components/tambo/add-user-form.tsx:65-70
- Checks if email is provided and not empty
- Validates email format using regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- If invalid: Shows error, stops submission, sets isSubmitting to false
```

**Step 2.2: Post Title Validation**

```typescript
// Location: components/tambo/add-user-form.tsx:80-85
- Checks if post title is provided and not empty
- If invalid: Shows error, stops submission, sets isSubmitting to false
```

**Step 2.3: Optional onSubmit Callback**

```typescript
// Location: components/tambo/add-user-form.tsx:88-97
- If onSubmit prop is provided, calls it with form data
- This allows parent components to react to submission start
```

### Phase 3: API Request to Backend

**Step 3.1: HTTP POST Request**

```typescript
// Location: components/tambo/add-user-form.tsx:99-114
fetch("/api/addUser", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: email.trim(),
    name: name.trim() || null,
    post: {
      title: postTitle.trim(),
      content: postContent.trim() || null,
      published: published,
    },
  }),
});
```

**Step 3.2: Request Sent to Next.js API Route**

- Route: `app/api/addUser/route.ts`
- Method: `POST`
- Payload includes user and post data

### Phase 4: Server-Side Processing

**Step 4.1: Request Parsing & Validation**

```typescript
// Location: app/api/addUser/route.ts:6-31
- Parses JSON body from request
- Extracts: email, name, post
- Validates email format (server-side)
- Validates post title if post data exists
- Returns 400 error if validation fails
```

**Step 4.2: Duplicate Email Check**

```typescript
// Location: app/api/addUser/route.ts:33-43
- Queries database for existing user with same email
- Uses Prisma: prisma.user.findUnique({ where: { email } })
- Returns 409 conflict error if email already exists
```

**Step 4.3: Database Transaction**

```typescript
// Location: app/api/addUser/route.ts:45-70
prisma.$transaction(async (tx) => {
  // Step 4.3.1: Create User
  const user = await tx.user.create({
    data: {
      email: email.trim(),
      name: name && name.trim() ? name.trim() : null,
    },
  });

  // Step 4.3.2: Create Post (if provided)
  if (post) {
    const createdPost = await tx.post.create({
      data: {
        title: post.title.trim(),
        content: post.content?.trim() || null,
        published: post.published === true,
        authorId: user.id, // Links post to user
      },
    });
  }

  return { user, post: createdPost };
});
```

**Step 4.4: Response Sent to Client**

```typescript
// Location: app/api/addUser/route.ts:72
- Returns JSON response with status 201 (Created)
- Response body: { user: {...}, post: {...} }
```

### Phase 5: Client-Side Success Handling

**Step 5.1: Response Processing**

```typescript
// Location: components/tambo/add-user-form.tsx:123
const data = await response.json();
// data contains: { user: {...}, post: {...} }
```

**Step 5.2: AI Feedback Message**

```typescript
// Location: components/tambo/add-user-form.tsx:125-135
- Constructs success message with user and post details
- Uses useTamboThread hook: const { sendThreadMessage, thread } = useTamboThread()
- Sends message to Tambo AI:
  sendThreadMessage(successMessage, {
    threadId: thread.id,
    streamResponse: true
  })
- Message includes:
  * User email, name, ID
  * Post title, published status, ID
  * Confirmation that table was updated
- Error handling: If AI feedback fails, logs error but doesn't block success flow
```

**Step 5.3: Callback Execution**

```typescript
// Location: components/tambo/add-user-form.tsx:137-145
- Calls onSuccess callback if provided (with user/post data)
- Calls onRefresh callback if provided (triggers table refresh)
```

### Phase 6: Table Refresh

**Step 6.1: Refresh Function Execution**

```typescript
// Location: app/dashboard/page.tsx:47-62
const fetchData = async () => {
  setLoading(true);
  setError(null);
  const response = await fetch("/api/getUser");
  const data = await response.json();
  setUsers(data); // Updates state with new data
  setLoading(false);
};
```

**Step 6.2: State Update Triggers Re-render**

- React detects `users` state change
- Dashboard component re-renders
- Tables automatically show new user and post
- Loading spinner appears briefly during fetch

**Step 6.3: UI Updates**

- Users table shows new row with:
  - New user ID
  - User name/email
  - Post count (1)
- Posts table shows new row with:
  - New post ID
  - Post title
  - Post content
  - Author name
  - Published status

### Phase 7: Form Reset

**Step 7.1: Clear Form Fields**

```typescript
// Location: components/tambo/add-user-form.tsx:147-152
setEmail("");
setName("");
setPostTitle("");
setPostContent("");
setPublished(false);
```

**Step 7.2: Reset Submission State**

```typescript
// Location: components/tambo/add-user-form.tsx:160-162
setIsSubmitting(false);
// Form fields become enabled again
// Submit button text changes back to "Add User & Post"
```

### Phase 8: AI Response (Optional)

**Step 8.1: Tambo AI Processes Feedback**

- AI receives the success message in the thread
- AI can respond with:
  - Confirmation message
  - Additional insights
  - Suggestions for next actions

**Step 8.2: AI Response Displayed**

- Response appears in the MessageThreadCollapsible component
- User can see AI's acknowledgment of the successful submission

## Error Handling Flow

### If Validation Fails (Client-Side)

```
Validation Error → setError(message) → Display error in form → setIsSubmitting(false) → Stop
```

### If API Request Fails

```
API Error → catch block → setError(errorMessage) → Call onError callback → Display error → setIsSubmitting(false)
```

### If Database Transaction Fails

```
Prisma Error → catch block → Check error code (P2002 for duplicates) → Return appropriate error → Client handles error
```

## Key Tambo Hooks & APIs Used

1. **useTamboThread()**
   - Provides: `sendThreadMessage`, `thread`
   - Used for: Sending feedback to AI
   - Location: `@tambo-ai/react`

2. **useSession()**
   - Provides: Current user session data
   - Used for: Pre-filling form placeholders
   - Location: `next-auth/react`

3. **Prisma Client**
   - Used for: Database operations
   - Transaction ensures: User and post created atomically
   - Location: `lib/prisma.ts`

## Data Flow Summary

```
Form State → API Request → Database → API Response → AI Message → Table Refresh → Form Reset
   ↓            ↓            ↓            ↓             ↓              ↓             ↓
Local        HTTP POST    Prisma      JSON Data    Thread Message   fetchData()   useState
State        Request      Transaction  Response     Stream           State Update   Reset
```

## Component Interaction Diagram

```
┌─────────────────┐
│  AddUserForm    │
│  Component      │
└────────┬────────┘
         │
         │ onRefresh()
         ▼
┌─────────────────┐
│  Dashboard      │
│  Page           │
└────────┬────────┘
         │
         │ fetchData()
         ▼
┌─────────────────┐
│  /api/getUser   │
│  API Route      │
└────────┬────────┘
         │
         │ Prisma Query
         ▼
┌─────────────────┐
│   Database      │
│   (PostgreSQL)  │
└─────────────────┘

┌─────────────────┐
│  AddUserForm    │
│  Component      │
└────────┬────────┘
         │
         │ sendThreadMessage()
         ▼
┌─────────────────┐
│  Tambo Thread   │
│  Provider       │
└────────┬────────┘
         │
         │ Stream Response
         ▼
┌─────────────────┐
│  Tambo AI       │
│  (LLM)          │
└─────────────────┘
```

## Timing Sequence

```
T0: User clicks submit
T1: Client validation (0-50ms)
T2: API request sent (50-100ms)
T3: Server validation (100-150ms)
T4: Database transaction (150-300ms)
T5: API response received (300-350ms)
T6: AI feedback sent (350-400ms)
T7: Table refresh started (400-450ms)
T8: Table refresh complete (450-600ms)
T9: Form reset (600-650ms)
T10: AI response received (650-2000ms, async)
```

## Benefits of This Flow

1. **Atomic Operations**: Database transaction ensures user and post are created together or not at all
2. **Real-time Feedback**: AI receives immediate notification of successful submission
3. **Automatic Updates**: Table refreshes without manual page reload
4. **Error Resilience**: AI feedback failure doesn't block form submission
5. **User Experience**: Loading states and error messages provide clear feedback
