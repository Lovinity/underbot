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

    var guild = DiscordClient.guilds.resolve(inputs.guild);
    if (!guild)
      throw 'notFound';

    return {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      numMembers: guild.members.cache.filter((member) => !member.user.bot).length,
      numBots: guild.members.cache.filter((member) => member.user.bot).length,
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
      characters: guild.characters.map((character) => {
        return {
          uid: character.uid,
          name: character.name,
          sprite: character.sprite,
          claimed: character.userID !== null,
          OC: character.OC
        }
      })
    };

  }


};
