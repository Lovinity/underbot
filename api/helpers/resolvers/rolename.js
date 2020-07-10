module.exports = {
  friendlyName: "resolvers.rolename",

  description:
    "Resolve a role name to a Discord role, or prompt if multiple roles match criteria.",

  inputs: {
    message: {
      type: "ref",
      required: true,
    },
    roleName: {
      type: "string",
      required: true,
    },
  },

  fn: async function (inputs) {
    var regExpEsc = (str) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    if (!inputs.message.guild)
      throw new Error(
        `Invalid: rolename arguments cannot be used outside of a guild.`
      );
    const resRole = resolveRole(inputs.roleName, inputs.message.guild);
    if (resRole) return resRole;

    const results = [];
    const reg = new RegExp(regExpEsc(inputs.roleName), "i");
    for (const role of inputs.message.guild.roles.cache.values()) {
      if (reg.test(role.name)) results.push(role);
    }

    let querySearch;
    if (results.length > 0) {
      const regWord = new RegExp(`\\b${regExpEsc(inputs.roleName)}\\b`, "i");
      const filtered = results.filter((role) => regWord.test(role.name));
      querySearch = filtered.length > 0 ? filtered : results;
    } else {
      querySearch = results;
    }

    switch (querySearch.length) {
      case 0:
        throw new Error(
          `Sorry, I could not find any roles that matched ${possible.name}.`
        );
      case 1:
        return querySearch[0];
      default:
        return await new Promise(async (resolve, reject) => {
          var children = [];
          querySearch.forEach((option) => {
            children.push({
              title: option.name,
              function: (outputMessage, senderMessage) => {
                outputMessage.delete();
                return resolve(option);
              },
            });
          });

          const menuTemplate = {
            title: ":question: Choose a role",
            description: `Multiple roles match the role you provided: ${inputs.roleName}. Please click the reaction corresponding to the role you want.`,
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

function resolveRole(query, guild) {
  if (query instanceof Discord.Role)
    return guild.roles.has(query.id) ? query : null;
  if (
    typeof query === "string" &&
    sails.config.custom.discord.regex.role.test(query)
  )
    return guild.roles.resolve(
      sails.config.custom.discord.regex.role.exec(query)[1]
    );
  return null;
}
