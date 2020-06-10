module.exports = {


    friendlyName: 'Channel / Send',


    description: 'Send a message in a channel',


    inputs: {
        channel: {
            type: 'string',
            required: true,
            description: 'The channel ID to send a message to.'
        },
        message: {
            type: 'string',
            required: true,
            description: 'The message to send.'
        }
    },


    exits: {
        notFound: {
            description: 'Could not find the provided channel.',
            responseType: 'notFound'
        }
    },


    fn: async function (inputs) {

        // Get channel
        var channel = DiscordClient.channels.resolve(inputs.channel);
        if (!channel)
            throw 'notFound';

        return channel.send(inputs.message);

    }


};
