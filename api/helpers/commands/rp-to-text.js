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

        var message = await inputs.message.send(`:hourglass: Please wait; this could take a while... (generating list of channels to fetch messages)`);

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

        var channel;

        var nextChannel = (async () => {
            if (index >= channels.length)
                return;

            if (!channels[ index ]) {
                index++;
                await nextChannel();
            }

            await message.edit(`:hourglass: Please wait; this could take a while... (Fetching messages from channel ${index + 1}/${channels.length})`);

            await nextMessageBatch();
        });

        var nextMessageBatch = (() => {
            return new Promise(async (resolve, reject) => {
                setTimeout(async () => {
                    var msg = await channels[ index ].messages.fetch();
                    if (!msg || msg.size === 0) {
                        index++;
                        await nextChannel();
                        return resolve();
                    } else {
                        msg = msg.array();
                        messages = messages.concat(msg);
                        await nextMessageBatch();
                        return resolve();
                    }
                }, 3000)
            });
        });

        await nextChannel();

        await message.edit(`:hourglass: Please wait; this could take a while... (Sorting messages)`);

        var compare = (a, b) => {
            return a.id - b.id;
        }

        messages = messages.sort(compare);

        await message.edit(`:hourglass: Please wait; this could take a while... (Generating text file)`);

        var data = ``;

        messages.map((message) => {
            // Write each message to data
            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}, channel ${message.channel.name}+++\n`;
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

        await message.edit(`DONE!`, { files: [ { attachment: buffer, name: `RPtext.txt` } ] });
    }


};
