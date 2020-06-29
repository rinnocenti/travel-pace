Hooks.once("init", () => {
    game.settings.register("travel-pace", "toolbarTravelPace", {
        name: game.i18n.localize('TravelPace.Settings.ButtomName'),
        hint: game.i18n.localize('TravelPace.Settings.ButtomNameHint'),
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
});
