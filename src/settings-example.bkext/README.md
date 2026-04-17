# Settings Example

Minimal extension showing how to:

- Add a settings panel (`bike.settings.addItem`) with a checkbox bound to a user default via `bike.defaults.set` / `bike.defaults.get`.
- Observe that same default from the app context with `bike.defaults.observe` and log when the value changes.

See `calendar.bkext` in `core-extensions` for a fuller example.
