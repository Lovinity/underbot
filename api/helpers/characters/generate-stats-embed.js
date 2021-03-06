module.exports = {
  friendlyName: "characters.generateStatsEmbed",

  description: "Make a Discord embed of a character stats",

  inputs: {
    character: {
      type: "ref",
      required: true,
      description: "the character record",
    },
  },

  exits: {},

  fn: async function (inputs) {
    // Get the owner
    var member;
    if (inputs.character.userID) {
      member = await DiscordClient.users.fetch(inputs.character.userID);
    }

    // Get the HP
    var maxHP = await sails.helpers.characters.calculateMaxHp(inputs.character);
    var percent = maxHP > 0 ? inputs.character.HP / maxHP : 0;
    var lvl = await sails.helpers.characters.calculateLevel(inputs.character);

    // Determine emojis to use
    var hpBar = ``;
    for (var i = 0; i < 10; i++) {
      if (percent > i / 10) {
        hpBar += `:green_heart: `;
      } else {
        hpBar += `:black_heart: `;
      }
    }

    // Now for determination
    var dtBar = ``;
    for (var i = 0; i < 10; i++) {
      if (inputs.character.DT > i * 10) {
        dtBar += `:heart: `;
      } else {
        dtBar += `:black_heart: `;
      }
    }

    var embed = new Discord.MessageEmbed()
      .setTitle(`Stats for ${inputs.character.name}`)
      .setAuthor(member ? member.tag : `**Unclaimed Character**`)
      .setThumbnail(
        `${sails.config.custom.baseURL}/characters/photo?uid=${inputs.character.uid}`
      )
      .addFields(
        {
          name: "HP (Health)",
          value:
            `${inputs.character.HP} HP / ${maxHP} HP${
              inputs.character.HP <= 0 ? ` **DEAD**` : ``
            }` +
            "\n" +
            hpBar,
        },
        {
          name: "LOVE [EXP] (Level of Violence; Execution points)",
          value: `${lvl} [${inputs.character.EXP}]`,
        },
        {
          name: "DT (Determination)",
          value: inputs.character.DT + "\n" + dtBar,
        },
        {
          name: "ATK (Attack)",
          value: inputs.character.ATK !== "" ? inputs.character.ATK : "Unknown",
        },
        {
          name: "DEF (Defense)",
          value: inputs.character.DEF !== "" ? inputs.character.DEF : "Unknown",
        },
        { name: "G (gold)", value: `${inputs.character.gold}G` },
        {
          name: "Items",
          value:
            inputs.character.items.length > 0
              ? inputs.character.items
                  .map((item) => `* ${item.name}`)
                  .join("\n")
              : `None`,
        }
      );

    return embed;
  },
};
