module.exports = {


    friendlyName: 'Guild / Leave',
  
  
    description: 'Make the bot leave a guild.',
  
  
    inputs: {
      guild: {
        type: 'string',
        required: true,
        description: 'The Snowflake ID of the guild to leave.'
      }
    },
  
  
    exits: {
      notFound: {
        description: 'The bot is not in the provided guild.',
        responseType: 'notFound'
      }
    },
  
  
    fn: async function (inputs) {
  
      // Get guild
      var guild = DiscordClient.guilds.resolve(inputs.guild);
      if (!guild)
        throw 'notFound';
  
      await guild.leave();
  
    }
  
  
  };
  