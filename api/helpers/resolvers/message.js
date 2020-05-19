module.exports = {


  friendlyName: 'resolvers.message',


  description: 'Resolve a snowflake to a Discord message from the channel.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
    snowflake: {
      type: 'string',
      required: true
    }
  },


  fn: async function (inputs) {
    const msg = sails.config.custom.discord.regex.snowflake.test(inputs.snowflake) ? await inputs.message.channel.messages.fetch(inputs.snowflake).catch(() => null) : undefined;
		if (msg) return msg;
    
    throw new Error(`Invalid message: ${inputs.snowflake}. Remember, bot can only resolve messages in the same channel.`);
  }


};

