# Todos

This extension adds a **Todos** inspector item to every window, listing the unchecked tasks in the current outline. Check one off to toggle it done, or click its text to select that row in the editor. Key to making this work with minimal code is `bike.session.observeOutlineQuery`, which keeps the list in sync with the outline using the `//task not @done` query.

Only the first 10 tasks are listed. The collapsed query uses a step slice, `//task not @done[1:11]`, asking for one more task than it displays — if 11 come back there is more to see, and a **Show More…** link switches to the unsliced query. **Show Less** goes back to 10.
