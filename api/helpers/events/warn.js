module.exports = {
  friendlyName: "events.warn",

  description: "DiscordClient warn event",

  inputs: {
    info: {
      type: "string",
      required: true,
    },
  },

  exits: {},

  fn: async function (inputs) {
    sails.log.warn(inputs.info);
  },
};
