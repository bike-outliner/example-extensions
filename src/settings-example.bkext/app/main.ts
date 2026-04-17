import { AppExtensionContext } from 'bike/app'
import { settingsDefaults } from '../dom/protocols'

export async function activate(context: AppExtensionContext) {
  bike.defaults.registerDefaults(settingsDefaults)

  bike.settings.addItem({
    label: 'Settings Example',
    script: 'Settings.js',
  })

  bike.defaults.observe('enabled', (value) => {
    console.log('settings-example: enabled changed to', value)
  })

  bike.commands.addCommands({
    commands: {
      'settings-example:show-alert': async () => {
        const result = await bike.showAlert({
          title: 'Settings Example',
          message: `Enabled is currently ${bike.defaults.get('enabled') === true}.`,
          buttons: ['OK', 'Cancel'],
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Name',
              placeholder: 'Your name',
            },
          ],
        })
        if (result.button === 'OK') {
          console.log('settings-example: name =', result.values['name'])
        }
        return true
      },
    },
  })
}
