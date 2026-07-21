describe("OutlineEditor filter reentrancy", () => {
    const editor = bike.testEditor()

    it("can set and clear filter without reentrancy crash", () => {
        editor.filter = "//heading"
        // The getter returns the filter struct (a bare-path set has no label).
        assert.equal(editor.filter?.path, "//heading")
        editor.filter = undefined
    })
})
