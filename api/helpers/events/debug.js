module.exports = {
  friendlyName: `sails.helpers.events.debug`,

  description: "DiscordClient debug event",

  inputs: {
    info: {
      type: "string",
      description: "The debug information",
      required: true,
    },
  },

  fn: async function (inputs) {
    sails.log.debug(`Discord: ${inputs.info}`);
  },
};
