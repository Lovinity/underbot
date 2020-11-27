module.exports = {
  friendlyName: "permissions.checkRole",

  description: "Check if a Discord member has the provided guildSettings role",

  inputs: {
    member: {
      type: "ref",
      required: true,
      description: "The member to check",
    },
    role: {
      type: "string",
      required: true,
      description:
        "The guildSettings key containing the role we want to check for. If not set, this will always return true.",
    },
  },

  fn: async function (inputs) {
    let guildSettings = await inputs.member.guild.settings();

    // Setting not set? Always allow
    if (!guildSettings[inputs.role]) return true;

    // Setting set, but role does not exist? Always return false.
    if (
      !inputs.member.guild.roles.cache.has(
        guildSettings[inputs.role]
      )
    )
      return false;

    // If the member has the role, return true
    if (
      inputs.member.roles.cache.has(guildSettings[inputs.role])
    )
      return true;

    // If we reach here, return false
    return false;
  },
};
