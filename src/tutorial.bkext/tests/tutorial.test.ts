import { Row } from 'bike/app'

describe("Archive Done Command", () => {
    const editor = bike.testEditor()
    const outline = editor.outline

    it("sets up tasks with some marked done", () => {
        outline.transaction({ label: "setup" }, () => {
            let rows = outline.insertRows([
                { type: "task", text: "Task 1" },
                { type: "task", text: "Task 2" },
                { type: "task", text: "Task 3" },
            ], outline.root)
            rows[0].setAttribute("done", "")
            rows[2].setAttribute("done", "")
        })
        assert.equal(outline.root.children.length, 3)
    })

    it("archives done tasks", () => {
        bike.commands.performCommand("tutorial:archive-done", { editor })
        let archiveRow = (outline.query('//@id = archive').value as Row[])[0]
        assert(archiveRow, "Expected an Archive row to be created")
        assert.equal(archiveRow.children.length, 2, "Expected 2 done tasks archived")
        assert.equal(archiveRow.firstChild!.text.string, "Task 1")
        assert.equal(archiveRow.lastChild!.text.string, "Task 3")
    })

    it("leaves undone tasks in place", () => {
        let topLevelRows = outline.root.children.filter(r => r.id !== "archive")
        assert.equal(topLevelRows.length, 1, "Expected 1 undone task remaining")
        assert.equal(topLevelRows[0].text.string, "Task 2")
    })
})