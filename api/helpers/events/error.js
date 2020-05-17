module.exports = {


  friendlyName: 'events.error',


  description: 'DiscordClient error event.',


  inputs: {
    error: {
      type: 'ref',
      description: 'Error',
      required: true
    }
  },


  fn: async function (inputs) {
    sails.log.error(inputs.error);

    // Send a message to the owner in DM
    if (sails.config.custom.discord.clientOwner) {
      var owner = DiscordClient.users.resolve(sails.config.custom.discord.clientOwner);
      if (owner) {
        owner.send(`:x: ERROR: :x:
        ${inputs.error.message}`);
      }
    }
  }


};

