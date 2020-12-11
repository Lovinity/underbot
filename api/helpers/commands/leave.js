module.exports = {
    friendlyName: "commands.leave",
  
    description: "Leave the guild",
  
    inputs: {
      message: {
        type: "ref",
        required: true,
        description: "The message that triggered the command",
      },
    },
  
    exits: {},
  
    fn: async function (inputs) {
      // Delete original command message
      inputs.message.delete();

      await inputs.message.guild.leave();

      return;
    },
  };
  