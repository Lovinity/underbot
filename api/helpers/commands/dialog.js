const canvas = require("canvas");

module.exports = {


  friendlyName: 'commands.dialog',


  description: 'Undertale dialog generator.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message that triggered the command'
    },
    character: {
      type: 'string',
      required: true,
      description: 'The name of the character in the database to generate a dialog.'
    },
    text: {
      type: 'string',
      required: true,
      description: 'The text to put in the dialog.'
    }
  },


  exits: {

  },


  fn: async function (inputs) {
    // TODO
  }


};

