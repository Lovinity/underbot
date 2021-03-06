/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {
  discord: {
    clientOptions: {
      // Discord.js clientOptions. You can override in local.js
      messageCacheMaxSize: 10000,
      messageCacheLifetime: 60 * 60 * 24 * 10,
      messageSweepInterval: 60 * 60,
      // fetchAllMembers: true,
      partials: ["USER", "MESSAGE", "CHANNEL", "GUILD_MEMBER", "REACTION"],
      ws: {
        intents: [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_MEMBERS",
          "GUILD_PRESENCES",
          "GUILD_MESSAGE_REACTIONS",
          "DIRECT_MESSAGES"
        ], // TODO: October 7, 2020, these are required to be defined
      },
    },
    regex: {
      userOrMember: /^(?:<@!?)?(\d{17,19})>?$/,
      channel: /^(?:<#)?(\d{17,19})>?$/,
      emoji: /^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/,
      role: /^(?:<@&)?(\d{17,19})>?$/,
      snowflake: /^(\d{17,19})$/,
    },
    defaultPrefix: `ub!`, // Default prefix for activating bot commands if not set in guild settings.
    token: ``, // Bot user token
    clientOwner: ``, // Snowflake ID of the bot owner
    guildBlacklist: [], // Array of guild IDs that should not be allowed to use this bot

    // Words considered profane by spam detection
    profanity: [
      "5h1t",
      "5hit",
      "assfukka",
      "asshole",
      "asswhole",
      "b!tch",
      "b17ch",
      "b1tch",
      "bi+ch",
      "biatch",
      "bitch",
      "bunny fucker",
      "carpet muncher",
      "chink",
      "cl1t",
      "clit",
      "cnut",
      "cock-sucker",
      "cockface",
      "cockhead",
      "cockmunch",
      "cocksuck",
      "cocksuka",
      "cocksukka",
      "cokmuncher",
      "coksucka",
      "cunt",
      "cyberfuc",
      "dickhead",
      "dog-fucker",
      "donkeyribber",
      "dyke",
      "f u c k",
      "fag",
      "fannyfucker",
      "fatass",
      "fcuk",
      "fuck",
      "fudge packer",
      "fudgepacker",
      "fuk",
      "fux",
      "fux0r",
      "f_u_c_k",
      "gangbang",
      "gaylord",
      "god-dam",
      "goddamn",
      "heshe",
      "kawk",
      "l3i+ch",
      "l3itch",
      "mo-fo",
      "mof0",
      "mofo",
      "muthafecker",
      "muthafuckker",
      "mutherfucker",
      "n1gga",
      "n1gger",
      "nigg3r",
      "nigg4h",
      "nigga",
      "nigger",
      "nibba",
      "nob jokey",
      "nobhead",
      "nobjocky",
      "nobjokey",
      "numbnuts",
      "phuck",
      "phuk",
      "phuq",
      "pimpis",
      "piss",
      "prick",
      "pusse",
      "pussi",
      "pussies",
      "pussy",
      "retard",
      "rimjaw",
      "sh!+",
      "sh!t",
      "sh1t",
      "shagger",
      "shemale",
      "shi+",
      "shit",
      "skank",
      "slut",
      "sluts",
      "s_h_i_t",
      "t1tt1e5",
      "t1tties",
      "titfuck",
      "tits",
      "tittie5",
      "tittiefucker",
      "titties",
      "tw4t",
      "twat",
      "twunt",
      "w00se",
      "wanker",
      "whore",
    ],
  },

  baseURL: `https://example.com`, // Base URL for the REST API
};
