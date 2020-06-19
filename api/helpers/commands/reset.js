module.exports = {


    friendlyName: 'commands.reset',


    description: 'Reset the bot',


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
        inputs.message.send('RESET in progress...');

        setTimeout(() => {
            inputs.message.send('RESET complete!');
        }, 60000);
    }


};
