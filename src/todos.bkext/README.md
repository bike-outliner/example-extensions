# Todos

This extension adds a **Todos** inspector item to every window, listing the unchecked tasks in the current outline. Check one off to toggle it done, or click its text to select that row in the editor. Key to making this work with minimal code is `bike.session.observeOutlineQuery`, which keeps the list in sync with the outline using the `//task not @done` query.
