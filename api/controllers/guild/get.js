module.exports = {
  friendlyName: "Guild / Get",

  description: "Get information about a guild the bot is currently in.",

  inputs: {
    guild: {
      type: "string",
      required: true,
      description: "The Snowflake ID of the guild to retrieve information.",
    },
  },

  exits: {
    notFound: {
      description: "The bot is not in the provided guild.",
      responseType: "notFound",
    },
  },

  fn: async function (inputs) {
    // Get guild
    var guild = DiscordClient.guilds.resolve(inputs.guild);
    if (!guild) throw "notFound";

    // Some properties of guild characters are async, so fetch them now with a promise.
    let guildCharacters = await guild.characters();
    var maps = await guildCharacters.map(async (character) => {
      character.maxHP = await sails.helpers.characters.calculateMaxHp(
        character
      );
      character.LVL = await sails.helpers.characters.calculateLevel(character);
      character.HPPercent =
        character.maxHP > 0 ? (character.HP / character.maxHP) * 100 : 0;
      character.claimed = character.userID !== null;
      if (!character.userID) {
        character.owner = "Unclaimed";
      } else {
        character.owner = guild.members.resolve(character.userID);
        if (character.owner) {
          character.owner = character.owner.user.tag;
        } else {
          character.owner = "Unknown User";
        }
      }
      return character;
    });
    var guildCharacters2 = await Promise.all(maps);

    var members = guild.members.cache.map(async (member) => {
      var staff = member.permissions.has("VIEW_AUDIT_LOG");
      var settings = await member.settings();
      return {
        id: member.id,
        tag: member.user.tag,
        nickname: member.nickname,
        avatar: member.user.displayAvatarURL(),
        joinedTimestamp: member.joinedTimestamp,
        joinedAt: moment(member.joinedAt).format("LLLL"),
        staff: staff,
        bot: member.user.bot,
        roles: member.roles.cache.map((role) => {
          return {
            id: role.id,
            name: role.name,
            hexColor: role.hexColor,
          };
        }),
        rpPosts: settings.rpPosts,
        introduction: settings.introduction,
      };
    });
    await Promise.all(members);

    return {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      numMembers: guild.members.cache.filter((member) => !member.user.bot).size,
      numBots: guild.members.cache.filter((member) => member.user.bot).size,
      members: members,
      claimedCharacters: guildCharacters.filter(
        (character) => character.userID !== null
      ).size,
      unclaimedCharacters: guildCharacters.filter(
        (character) => character.userID === null
      ).size,
      characters: guildCharacters2,
      DT: {
        total: guildCharacters
          .filter((character) => character.userID !== null && character.HP > 0)
          .reduce((acc, character) => acc + character.DT, 0),
        low: guildCharacters.filter(
          (character) =>
            character.userID !== null && character.HP > 0 && character.DT < 26
        ).size,
        normal: guildCharacters.filter(
          (character) =>
            character.userID !== null &&
            character.HP > 0 &&
            character.DT >= 26 &&
            character.DT < 76
        ).size,
        high: guildCharacters.filter(
          (character) =>
            character.userID !== null && character.HP > 0 && character.DT >= 76
        ).size,
      },
    };
  },
};
