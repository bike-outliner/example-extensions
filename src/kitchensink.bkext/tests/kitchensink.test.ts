describe("Kitchen Sink Commands", () => {
    it("has kitchensink commands registered", () => {
        const commands = bike.commands.toString()
        assert(commands.includes("kitchensink:set-row-type"), "Missing kitchensink:set-row-type")
        assert(commands.includes("kitchensink:insert-style-demo"), "Missing kitchensink:insert-style-demo")
        assert(commands.includes("kitchensink:status-message-demo"), "Missing kitchensink:status-message-demo")
        assert(commands.includes("kitchensink:components-demo"), "Missing kitchensink:components-demo")
    })
})
