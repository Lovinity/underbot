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
    var guildCharacters = guild.characters.map(async (character) => {
      var maxHP = await sails.helpers.calculateMaxHp(character);
      return Object.assign(character, {
        LVL: await sails.helpers.calculateLevel(character),
        maxHP: await sails.helpers.calculateMaxHp(character),
        HPPercent: maxHP > 0 ? (character.HP / character.maxHP) * 100 : 0,
        claimed: character.userID !== null,
        owner: character.userID ? guild.members.resolve(character.userID).user.tag : 'Unclaimed'
      });
    });
    await Promise.all(guildCharacters);

    return {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      numMembers: guild.members.cache.filter((member) => !member.user.bot).size,
      numBots: guild.members.cache.filter((member) => member.user.bot).size,
      members: guild.members.cache.map((member) => {
        return {
          id: member.id,
          tag: member.user.tag,
          nickname: member.nickname,
          avatar: member.user.displayAvatarURL(),
          joinedTimestamp: member.joinedTimestamp,
          roles: member.roles.cache.map((role) => {
            return {
              id: role.id,
              name: role.name,
              hexColor: role.hexColor
            };
          }),
          settings: member.settings,
        };
      }),
      claimedCharacters: guild.characters.filter((character) => character.userID !== null).size,
      unclaimedCharacters: guild.characters.filter((character) => character.userID === null).size,
      characters: guildCharacters
    };

  }


};
