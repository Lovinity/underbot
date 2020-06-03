module.exports = {


  friendlyName: 'spam.applyMessage',


  description: 'Apply spam score for the provided message.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
  },


  fn: async function (inputs) {
    if (!inputs.message.member)
      return;

    await sails.helpers.spam.add(inputs.message.member, inputs.message.spamScore, inputs.message);
  }


};

