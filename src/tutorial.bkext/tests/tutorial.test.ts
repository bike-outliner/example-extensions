describe("Tutorial Commands", () => {
    it("has tutorial:archive-done command registered", () => {
        const commands = bike.commands.toString()
        assert(commands.includes("tutorial:archive-done"), "Missing tutorial:archive-done")
    })

})

describe("Tutorial Outline Operations", () => {
    const editor = bike.testEditor()
    const outline = editor.outline

    it("starts with an empty outline", () => {
        assert(!outline.root.firstChild, "Expected no children on root")
    })

    it("can create rows", () => {
        outline.transaction({ label: "test" }, () => {
            outline.insertRows(["one", "two", "three"], outline.root)
        })
        assert.equal(outline.root.children.length, 3)
    })

    it("can read row text", () => {
        const first = outline.root.firstChild!
        assert.equal(first.text.string, "one")
    })

    it("can query rows", () => {
        const result = outline.query("//row") as { type: 'elements', value: unknown[] }
        assert.equal(result.value.length, 3)
    })
})
