module.exports = {
  friendlyName: "resolvers.username",

  description:
    "Resolve a username to a Discord user, or prompt if multiple ones detected.",

  inputs: {
    message: {
      type: "ref",
      required: true,
    },
    username: {
      type: "string",
      required: true,
    },
  },

  fn: async function (inputs) {
    var regExpEsc = (str) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    if (!inputs.message.guild)
      return sails.helpers.resolvers.user(inputs.username);
    const resUser = await resolveUser(inputs.username, inputs.message.guild);
    if (resUser) return resUser;

    const results = [];
    const reg = new RegExp(regExpEsc(inputs.username), "i");
    for (const member of inputs.message.guild.members.cache.values()) {
      if (reg.test(member.user.username)) {
        results.push(member.user);
      } else if (reg.test(member.nickname)) {
        results.push(member.user);
      }
    }

    let querySearch;
    if (results.length > 0) {
      const regWord = new RegExp(`\\b${regExpEsc(inputs.username)}\\b`, "i");
      const filtered = results.filter((user) => regWord.test(user.username));
      querySearch = filtered.length > 0 ? filtered : results;
    } else {
      querySearch = results;
    }

    switch (querySearch.length) {
      case 0:
        throw new Error(
          `Sorry, I could not find any users matching the criteria provided for ${inputs.username}. Please make sure you provided a valid username, nickname, mention, or id.`
        );
      case 1:
        return querySearch[0];
      default:
        return await new Promise(async (resolve, reject) => {
          var children = [];
          querySearch.forEach((option) => {
            children.push({
              title: option.tag || option.user.tag,
              function: (outputMessage, senderMessage) => {
                outputMessage.delete();
                return resolve(option);
              },
            });
          });

          const menuTemplate = {
            title: ":question: Choose a user",
            description: `Multiple users match the name you provided: ${inputs.username}. Please click the reaction corresponding to the user you want.`,
            color: "BLUE",
            footer: {
              type: "timestamp",
              value: Date.now(),
            },
            children: children,
          };

          var response = await inputs.message.reply(`Please wait...`);
          const menu = new Discord.DiscordMenu(
            menuTemplate,
            response,
            inputs.message,
            {
              dataPersistance: true,
              backButton: true,
              time: 60,
            }
          );

          menu.start();
        });
    }
  },
};

function resolveUser(query, guild) {
  if (query instanceof Discord.GuildMember) return query.user;
  if (query instanceof Discord.User) return query;
  if (typeof query === "string") {
    if (sails.config.custom.discord.regex.userOrMember.test(query))
      return guild.client.users
        .fetch(sails.config.custom.discord.regex.userOrMember.exec(query)[1])
        .catch(() => null);
    if (/\w{1,32}#\d{4}/.test(query)) {
      const res = guild.members.cache.find(
        (member) => member.user.tag === query
      );
      return res ? res.user : null;
    }
  }
  return null;
}
