const random = require('crypto-random-string');

module.exports = {


  friendlyName: 'Uid',


  description: 'Generate string based on crypto randomness and the system time.',


  inputs: {

  },


  fn: async function (inputs) {
    var initial = Date.now().toString(16);
    return `${initial}${random({ length: 16 - initial.length })}`;
  }
};

