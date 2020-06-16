module.exports = {


  friendlyName: 'Guild / Get',


  description: 'Get information about a guild the bot is currently in.',


  inputs: {
    guild: {
      type: 'string',
      required: true,
      description: 'The Snowflake ID of the guild to retrieve information.'
    }
  },


  exits: {
    notFound: {
      description: 'The bot is not in the provided guild.',
      responseType: 'notFound'
    }
  },


  fn: async function (inputs) {

    // Get guild
    var guild = DiscordClient.guilds.resolve(inputs.guild);
    if (!guild)
      throw 'notFound';

    // Some properties of guild characters are async, so fetch them now with a promise.
    var maps = guild.characters.map(async (character) => {
      character.maxHP = await sails.helpers.characters.calculateMaxHp(character);
      character.LVL = await sails.helpers.characters.calculateLevel(character);
      character.HPPercent = character.maxHP > 0 ? (character.HP / character.maxHP) * 100 : 0;
      character.claimed = character.userID !== null;
      if (!character.userID) {
        character.owner = 'Unclaimed';
      } else {
        character.owner = guild.members.resolve(character.userID);
        if (character.owner) {
          character.owner = character.owner.user.tag;
        } else {
          character.owner = 'Unknown User';
        }
      }
      return character;
    });
    var guildCharacters = await Promise.all(maps);

    return {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      numMembers: guild.members.cache.filter((member) => !member.user.bot).size,
      numBots: guild.members.cache.filter((member) => member.user.bot).size,
      members: guild.members.cache.map((member) => {
        var staff = member.permissions.has('VIEW_AUDIT_LOG');
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
              hexColor: role.hexColor
            };
          }),
          introduction: member.settings.introduction,
        };
      }),
      claimedCharacters: guild.characters.filter((character) => character.userID !== null).size,
      unclaimedCharacters: guild.characters.filter((character) => character.userID === null).size,
      characters: guildCharacters,
      DT: {
        total: guild.characters.filter((character) => character.userID !== null && character.HP > 0).reduce((acc, character) => acc + character.DT, 0),
        low: guild.characters.filter((character) => character.userID !== null && character.HP > 0 && character.DT < 26).size,
        normal: guild.characters.filter((character) => character.userID !== null && character.HP > 0 && character.DT >= 26 && character.DT < 76).size,
        high: guild.characters.filter((character) => character.userID !== null && character.HP > 0 && character.DT >= 76).size
      }
    };

  }


};
