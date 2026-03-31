describe("OutlineEditor filter reentrancy", () => {
    const editor = bike.testEditor()

    it("can set and clear filter without reentrancy crash", () => {
        editor.filter = "//heading"
        assert.equal(editor.filter, "//heading")
        editor.filter = undefined as any
    })
})
