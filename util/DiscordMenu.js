let prevMenuCache;

// Rich menu capabilities

class DiscordMenu {
    constructor(input, message, sender, opts) {
        this.input = input;
        this.message = message;
        this.sender = sender;
        for (let key in opts) this[key] = opts[key];
    };

    _handleError(code) {
        let error = ``;
        switch(code) {
            case `MISSING_TITLE`:
                error = `Menu should contain a title.`;
                throw new Error(error);
            case `MISSING_REACTIONS`:
                error = `Reactions are needed in a menu.`;
                throw new Error(error);
            case `CHILDREN_NOT_ARRAY`:
                error = `Children expected to be Array`;
                throw new Error(error);
            case `MISSING_FUNCTION`:
                error = `Function property is missing or undefined.`;
                throw new Error(error);
            default:
                error = `Unknown error occured.`;
                throw new Error(error);
        };
    };


    _handleFunction(func) {
        return func(this.message, this.sender);
    };
    
    _handleEmbeds(menuData) {
        //this.message.reactions.removeAll();
        if (menuData.title === undefined) return this._handleError(`MISSING_TITLE`);
        if (menuData.children === undefined) {
            if (menuData.function === undefined) return this._handleError(`MISSING_FUNCTION`);
            else return this._handleFunction(menuData.function);
        };

        let reactions = {};
        let _reactions = [];
        let richEmbed = new Discord.MessageEmbed();

        richEmbed.setTitle(menuData.title);
        richEmbed.setDescription(menuData.description || ``);
        richEmbed.setThumbnail(menuData.thumbnail || (this.dataPersistance && this.input.thumbnail) || ``);
        richEmbed.setColor(menuData.color || (this.dataPersistance && this.input.color) || `GREY`);
        if (menuData.footer !== undefined) {
            menuData.footer.type === `timestamp` ? richEmbed.setTimestamp(menuData.footer.value || Date.now()) : ``;
            menuData.footer.type === `footer` ? richEmbed.setTimestamp(menuData.footer.value || Date.now()) : ``;
        } else if (this.dataPersistance && this.input.footer !== undefined) {
            this.input.footer.type === `timestamp` ? richEmbed.setTimestamp(this.input.footer.value || Date.now()) : ``;
            this.input.footer.type === `footer` ? richEmbed.setTimestamp(this.input.footer.value || Date.now()) : ``;
        };

        if (!Array.isArray(menuData.children)) return this._handleError(`CHILDREN_NOT_ARRAY`);

        for (let i = 0; i < menuData.children.length; i++) {
            let child = menuData.children[i];
            let emoji = child.emoji || `${Object.keys(reactions).length + 1}⃣`;
            richEmbed.addField(`${emoji}: ${child.title}` || this._handleError(`MISSING_TITLE`), child.description || `.`);
            reactions[emoji] = child.title;
            _reactions.push(emoji);
        };

        this.message.edit({embed: richEmbed}).then(_ => {

            const addReactions = emojis => {
                if (!emojis.length) return prevMenuCache !== undefined && menuData !== this.input && this.backButton ? this.message.react(this.input.backEmoji || `↩`) : ``;                ;
                this.message.react(emojis[0]).then(_ => {
                    emojis.shift();
                    return addReactions(emojis);
                });
            };

            addReactions(_reactions);

            const filter = (reaction, user) => {
                return ((reactions[reaction.emoji.name] !== undefined ||
                    reaction.emoji.name === (this.input.backEmoji || `↩`))) &&
                user.id === this.sender.author.id
            };
    
            this.message.awaitReactions(filter, {
                time: (this.time || 15) * 1000,
                max: 1,
                errors: [`time`]
            }).then(collected => {
                this.message.reactions.removeAll().then(_ => {
                    let chosen = collected.first().emoji.name;
                    if (this.backButton && chosen === (this.input.backEmoji || `↩`)) return this._handleEmbeds(prevMenuCache);
                    prevMenuCache = menuData;
                    if (reactions[chosen] === undefined) return this.message.edit(this.feedbackMessages.unknownOptions || `Unknown option selected. Menu has been closed.`, {embed: {}});
                    let childIndex = menuData.children.findIndex(v => v.title === reactions[chosen]);
                    this.message.edit((this.feedbackMessages && this.feedbackMessages.loadingMessage) || `Loading...`, {embed: {}});
                    return this._handleEmbeds(menuData.children[childIndex]);
                });
            }).catch(collected => {
                this.message.reactions.removeAll();
                if (collected instanceof Error) {
                    return this.message.edit(`An error occurred while executing the menu. Please check your console for more information.`, {embed: {}});
                };
                return this.message.edit((this.feedbackMessages && this.feedbackMessages.timeoutMessage) || `Menu timed out - No response received from user.`, {embed: {}});
            });
        });

    };

    start() {
        prevMenuCache = undefined;
        return this._handleEmbeds(this.input);
    };

    exit() {
        this.message.reactions.removeAll();
        return this.message.edit(this.feedbackMessages.forcedExit || `Menu has been closed.`, {embed: {}}); 
    };
};

module.exports = DiscordMenu;