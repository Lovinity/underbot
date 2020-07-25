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
    var barks = [
      "BARK",
      "BORK",
      "ARF",
      "WOOF",
      "RUFF",
      "YIP",
      "YAP",
      "YIF",
    ];
    var rareBarks = ["NYA", "*SNEEZE*", "*GROWL SNARL*"];

    var len = getRandomInt(15, 30);

    var str = ``;

    var barkIndex = getRandomInt(0, barks.length - 1);
    var random = getRandomInt(1, 3);
    var random2 = getRandomInt(1, 9);
    var random3 = getRandomInt(1, 50);
    for (var i = 0; i < len; i++) {
      if (random3 !== 25) {
        str += barks[barkIndex];
        if (random2 === 8 || random2 === 9) {
          str += `... `;
          if (random === 1) barkIndex = getRandomInt(0, barks.length - 1);
          random = getRandomInt(1, 3);
        } else if (random2 !== 7 && random2 !== 6) {
          str += ` `;
          if (random === 1) barkIndex = getRandomInt(0, barks.length - 1);
          random = getRandomInt(1, 3);
        }
      } else if (
        random2 !== 7 &&
        random2 !== 6 &&
        (random3 === 30 ||
          random3 === 31 ||
          random3 === 32 ||
          random3 === 33 ||
          random3 === 34)
      ) {
        var random4 = getRandomInt(3, 10);
        for (var i2 = 0; i2 < random4; i2++) {
          str += `*PANT* `;
        }
        str += `... `;
      } else {
        str += rareBarks[getRandomInt(0, rareBarks.length - 1)] + `... `;
      }
      random2 = getRandomInt(1, 9);
      random3 = getRandomInt(1, 50);
    }

    return inputs.message.channel.send(str);
  },
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
