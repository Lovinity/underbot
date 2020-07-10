module.exports = {
  friendlyName: "ub command",

  description: "Deletes the message and re-sends as the bot.",

  inputs: {
    message: {
      type: "string",
      required: true,
      description: "The message with the command.",
    },
    msg: {
      type: "string",
      required: true,
      description: "The message to send as the bot",
    },
  },

  exits: {},

  fn: async function (inputs) {
    inputs.message.delete();
    return inputs.message.send(inputs.msg);
  },
};
