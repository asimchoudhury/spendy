<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ
from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before
writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

<!-- BEGIN:agent-behaviour-rules -->
# Permanent agent behaviour rules

These rules apply to every session, for the lifetime of this project.

1. **Never guess at types.** Use only the interfaces and types already defined in the
   codebase. If a type is ambiguous, stop and ask — do not invent fields.

2. **Surface errors, never swallow them.** Hooks return `{ error: string | null }` —
   never throw, never silently ignore an error response from any external service.

3. **Never commit `.env.local`** or any file containing secrets or API keys.

4. **Currency is always INR.** Do not change `formatCurrency`, its locale (`en-IN`),
   or any currency-related logic.

5. **Keep the existing UI intact** unless a task explicitly requires changing it.
   Do not refactor, restyle, or reorganise code that is out of scope for the current task.
<!-- END:agent-behaviour-rules -->
