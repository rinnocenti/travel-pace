const PACENORMAL = "Normal";
class TravelPace {
    static getSceneControlButtons(buttons) {
        let tokenButton = buttons.find(b => b.name == "token")
        if (tokenButton) {
            tokenButton.tools.push({
                name: "travel-pace",
                title: game.i18n.localize('TravelPace.ButtomName'),
                icon: "fa fa-location-arrow",
                visible: game.settings.get("travel-pace", "toolbarTravelPace"),
                onClick: () => TravelPace.requestMeasure()
            });
        }
    }
    static requestMeasure() {
        //ui.notifications.warn("oi");
        if (TravelPace.requestor === undefined)
            TravelPace.requestor = new TravelPaceRequestor();
        TravelPace.requestor.render(true);
    }
}
class TravelPaceRequestor extends FormApplication {
    constructor(...args) {
        super(...args)
        game.users.apps.push(this)
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("TravelPace.RequestorName");
        options.id = "travel-pace";
        options.template = "modules/travel-pace/templates/template.html";
        options.closeOnSubmit = true;
        options.popOut = true;
        options.width = 400;
        options.height = "auto";
        options.classes = ["travel-pace"];
        return options;
    }
    activateListeners(html) {
        super.activateListeners(html);
        this.element.find("#jspeed").change(this._onUserChange.bind(this));
        this.element.find("#jmilesonroad").change(this._onUserChange.bind(this));
        this.element.find("#jmilesoffroad").change(this._onUserChange.bind(this));

        this.element.find(".travelpace-slow-buttom").click((event) => this.setTravelPace(event, 'Slow'));
        this.element.find(".travelpace-normal-buttom").click((event) => this.setTravelPace(event, 'Normal'));
        this.element.find(".travelpace-fast-buttom").click((event) => this.setTravelPace(event, 'Fast'))
    }
    setTravelPace(event, pace) {
        event.preventDefault();
        this.element.find("#pace").val(pace);
        $("#travel-pace-form").submit();
    }
    JourneyTime(speed, onroad, offroad, march, outDay = false) {
        let realDistance = ((onroad * 1) + (offroad * 2));
        let realSpeed = speed / 10;
        let total = realDistance / realSpeed;
        if (march === "Slow") {
            total = realDistance / (realSpeed / 3 * 2);
        } else if (march === "Fast") {
            total = realDistance / (realSpeed / 3 * 4);
        }
        let formatMeasure = game.i18n.format("TravelPace.Dialog.Journey", { hour: Math.floor(total), min: Math.floor(((total * 60) % 60)) });
        //The Travel Pace table assumes that characters travel for 8 hours in day
        if (outDay === true) {
            let days = Math.round(total / 8);
            if (days > 1) {
                formatMeasure += game.i18n.format("TravelPace.Dialog.JourneyDays", { days: days });
            } else {
                formatMeasure += game.i18n.format("TravelPace.Dialog.JourneyDay", { days: days });
            }
            
        }
        return formatMeasure;
    }
    async getData() {
        const pwNormal = this.JourneyTime(30, 10, 10, "Normal");
        const pwSlow = this.JourneyTime(30, 10, 10, "Slow");
        const pwQuick = this.JourneyTime(30, 10, 10, "Fast");
        return { pwNormal, pwSlow, pwQuick }
    }
    _onUserChange() {
        let typeSpeed = this.element.find("#jspeed").val();
        let typeOnRoad = this.element.find("#jmilesonroad").val();
        let typeOffRoad = this.element.find("#jmilesoffroad").val();

        $("#march-normal").html(this.JourneyTime(typeSpeed, typeOnRoad, typeOffRoad, "Normal"));
        $("#march-slow").html(this.JourneyTime(typeSpeed, typeOnRoad, typeOffRoad, "Slow"));
        $("#march-fast").html(this.JourneyTime(typeSpeed, typeOnRoad, typeOffRoad, "Fast"));
    }
    async _updateObject(event, formData) {
        //TODO: Fazer as mensagens do chat.
        //ui.notifications.warn('oi2');
        let speaker = ChatMessage.getSpeaker();
        if (!speaker.actor && game.user.character) speaker = ChatMessage.getSpeaker({ actor: game.user.character });
        let templateChat = "modules/travel-pace/templates/templateChat.html";
        let marchTotal = this.JourneyTime(formData["jspeed"], formData["jmilesonroad"], formData["jmilesoffroad"], formData["pace"], true);
        let marchDisclaimer = (formData["pace"] === 'Slow') ? game.i18n.localize("TravelPace.Dialog.SlowEffects") : (formData["pace"] === 'Fast') ? game.i18n.localize("TravelPace.Dialog.FastEffects"):"";
        let dialogNarrative = game.i18n.format("TravelPace.Dialog.Narrative", { marchSpeed: formData["jspeed"], marchOnRoad: formData["jmilesonroad"], marchOffRoad: formData["jmilesoffroad"] });
        let marchstring = "TravelPace.Pace" + formData["pace"]; 
        let marchType = game.i18n.localize(marchstring);
        let dialogData = {
            marchType: marchType,
            dialogNarrative: dialogNarrative,
            marchTotal: marchTotal,
            marchDisclaimer: marchDisclaimer,
            chatForced: game.settings.get("travel-pace", "ForcedMarchDialog")
        };
        let flavor = "<h3>" + game.i18n.localize("TravelPace.Dialog.Who") + "</h3>";
        let content = await renderTemplate(templateChat, dialogData);
        let messageData = {
            content: content,
            flavor: flavor,
            speaker: speaker
        };
        ChatMessage.create(messageData);
        console.log("Travel Pace submit: ", formData);
    }
}
Hooks.on('getSceneControlButtons', TravelPace.getSceneControlButtons);