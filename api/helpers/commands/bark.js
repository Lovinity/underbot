module.exports = {
  friendlyName: "helpers.commands.bark",

  description: "Make the bot bark randomly.",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command",
    },
  },

  exits: {
    success: {
      description: "All done.",
    },
  },

  fn: async function (inputs) {
    var barks = ["BARK", "ARF", "WOOF", "RUFF", "YIP", "YAP", "YIF", "GROWL"];

    var length = getRandomInt(15, 30);

    var string = ``;

    var barkIndex = getRandomInt(0, barks.length - 1);
    var random = getRandomInt(1, 3);
    var random2 = getRandomInt(1, 9);
    for (var i; i < length; i++) {
      string += barks[barkIndex];
      if (random2 === 8) {
        string += `... `;
        if (random === 1) barkIndex = getRandomInt(0, barks.length - 1);
        random = getRandomInt(1, 3);
      } else if (random2 !== 7 && random2 !== 6) {
        string += ` `;
        if (random === 1) barkIndex = getRandomInt(0, barks.length - 1);
        random = getRandomInt(1, 3);
      }
      random2 = getRandomInt(1, 9);
    }

    return inputs.message.channel.send(string);
  },
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
