# D3 Layouts

This extension uses d3.js to create layouts of Bike outlines. The view stays in sync with the outline as you edit, and in sync with the editor's focus, narrowing the layout to only include the focused outline branch. Key to making this work with minimal code is `bike.session.observeOutlineEditor`.