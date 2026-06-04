import { AppExtensionContext, Window } from 'bike/app'

export async function activate(context: AppExtensionContext) {
  bike.observeWindows(async (window: Window) => {
    await window.inspector.addItem({
      label: 'Todos',
      script: 'Todos.js',
    })
  })
}
