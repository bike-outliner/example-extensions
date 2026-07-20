import { AppExtensionContext, CommandContext } from 'bike/app'
import { registerVersioningBadge } from './badge'
import { deleteVersion, renameVersion, saveVersion, switchVersion, toggleVersioning } from './versioning'

export async function activate(_context: AppExtensionContext) {
  registerVersioningBadge()

  bike.commands.addCommands({
    commands: {
      'versioning:toggle': (ctx) => run(ctx, toggleVersioning),
      'versioning:save': (ctx) => run(ctx, saveVersion),
      'versioning:switch': (ctx) => run(ctx, (editor, row) => switchVersion(editor, row)),
      'versioning:rename': (ctx) => run(ctx, (editor, row) => renameVersion(editor, row)),
      'versioning:delete': (ctx) => run(ctx, (editor, row) => deleteVersion(editor, row)),
    },
  })

  // A `v`-leader chord keeps the block-mode namespace clean. Non-destructive
  // ops only; rename/delete stay on the badge card and command palette.
  bike.keybindings.addKeybindings({
    keymap: 'block-mode',
    keybindings: {
      'v v': 'versioning:toggle',
      'v s': 'versioning:save',
      'v w': 'versioning:switch',
    },
  })
}

type Handler = (editor: CommandContext['editor'], row: NonNullable<CommandContext['selection']>['row']) => Promise<boolean>

function run(ctx: CommandContext, handler: Handler): boolean | Promise<boolean> {
  const row = ctx.selection?.row
  if (!row) return false
  return handler(ctx.editor, row)
}
