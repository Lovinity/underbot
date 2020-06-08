module.exports = {


    friendlyName: 'commands.rpToText',


    description: 'Generate a time-ordered text file of messages from the RP channels.',


    inputs: {
        message: {
            type: 'ref',
            required: true,
            description: 'The message that triggered the command'
        },
    },


    exits: {

    },


    fn: async function (inputs) {
        // Delete original command message
        inputs.message.delete();

        // Check permissions
        if (!inputs.message.member.permissions.has('VIEW_AUDIT_LOG') && inputs.message.author.id !== sails.config.custom.discord.clientOwner) {
            throw new Error(`You are not allowed to use this command.`);
        }

        var mg = await inputs.message.send(`:hourglass: Please wait; this could take a while... (generating list of channels to fetch messages)`);

        var categories = [
            '710408355373383772', // ruins
            '710413557333884948', // snowdin
            '710413584772890685', // waterfall
            '710413617073487914', // Hotlands
            '710413931885363253', // Core
            '710413972385431633', // New home
            '711099427770728449', // Undernet
        ];

        var channels = inputs.message.guild.channels.cache.array()
            .filter((channel) => channel.parentID && categories.indexOf(channel.parentID) !== -1 && channel.type === 'text')

        var index = 0;

        var messages = [];

        var afterSnowflake = `712380653928316949`;
        var currentSnowflake;

        var channel;

        var compare = (a, b) => {
            return a.id - b.id;
        }
        var compareReverse = (a, b) => {
            return b.id - a.id;
        }

        var nextChannel = (async () => {
            sails.log.debug(`nextChannel index ${index}`)
            if (index >= channels.length)
                return;

            if (!channels[ index ]) {
                sails.log.debug(`Channel not found`)
                index++;
                await nextChannel();
            }

            sails.log.debug(`nextChannel channel name ${channels[ index ].name}`)

            await mg.edit(`:hourglass: Please wait; this could take a while... (Fetching messages from channel ${index + 1}/${channels.length})`);

            currentSnowflake = afterSnowflake;

            await nextMessageBatch();
        });

        var nextMessageBatch = (() => {
            return new Promise(async (resolve, reject) => {
                setTimeout(async () => {
                    sails.log.debug(`nextMessageBatch after snowflake ${currentSnowflake}`)
                    var msg = await channels[ index ].messages.fetch({ after: currentSnowflake }, false);
                    if (!msg || msg.size === 0) {
                        sails.log.debug(`nextMessageBatch: no more messages`)
                        index++;
                        await nextChannel();
                        return resolve();
                    } else {
                        sails.log.debug(`nextMessageBatch: got ${msg.size} messages.`)
                        msg = msg.array();
                        msg = msg.sort(compareReverse);
                        messages = messages.concat(msg);
                        currentSnowflake = msg[ 0 ].id;
                        await nextMessageBatch();
                        return resolve();
                    }
                }, 3000)
            });
        });

        await nextChannel();

        sails.log.debug(`nextChannel DONE`)

        await mg.edit(`:hourglass: Please wait; this could take a while... (Sorting messages)`);

        messages = messages.sort(compare);

        await mg.edit(`:hourglass: Please wait; this could take a while... (Generating text attachments)`);

        var splitMessages = (() => {
            return new Promise(async (resolve, reject) => {
                setTimeout(async () => {
                    var msgs = messages.splice(0, 500);

                    var data = ``;

                    msgs.map((message) => {
                        // Write each message to data
                        data += `+++Message in channel ${message.channel.parent ? message.channel.parent.name : `Unknown`} => ${message.channel.name} by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
                        data += `-Time: ${moment(message.createdAt).format()}\n`;
                        // Write attachment URLs
                        message.attachments.array().map((attachment) => {
                            data += `-Attachment: ${attachment.url}\n`;
                        });
                        // Write embeds as JSON
                        message.embeds.forEach((embed) => {
                            data += `-Embed: ${JSON.stringify(embed)}\n`;
                        });
                        // Write the clean version of the message content
                        data += `${message.cleanContent}\n\n\n`;
                    });

                    var buffer = Buffer.from(data, "utf-8");

                    await inputs.message.send({ files: [ { attachment: buffer, name: `RPtext_${await sails.helpers.uid()}.txt` } ] });

                    if (messages.length > 0)
                        await splitMessages();

                    return resolve();
                }, 3000)
            });
        });

        await splitMessages();

        await mg.edit(`DONE!`);
    }


};
