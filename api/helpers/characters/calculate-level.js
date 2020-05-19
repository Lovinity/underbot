module.exports = {


  friendlyName: 'characters.calculateLevel',


  description: 'Determine what lvl a character is.',


  inputs: {
    character: {
      type: 'ref',
      required: true,
      description: 'the character record'
    }
  },


  exits: {

  },


  fn: async function (inputs) {
    var lvl = 1;

    // EXP milestones that level you up
    var thresholds = [
      '10',
      '30',
      '70',
      '120',
      '200',
      '300',
      '500',
      '800',
      '1200',
      '1700',
      '2500',
      '3500',
      '5000',
      '7000',
      '10000',
      '15000',
      '25000',
      '50000',
      '99999'
    ];

    // Calculate level
    thresholds.forEach((thresh) => {
      if (inputs.character.EXP >= thresh) {
        lvl++;
      }
    });

    return lvl;
  }


};

