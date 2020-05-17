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
    clientOptions: { // Discord.js clientOptions. You can override in local.js
      messageCacheMaxSize: 10000,
      messageCacheLifetime: (60 * 60 * 24 * 10),
      messageSweepInterval: (60 * 60),
      // fetchAllMembers: true,
      partials: [ 'USER', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'REACTION' ],
    },
    regex: {
      userOrMember: /^(?:<@!?)?(\d{17,19})>?$/,
      channel: /^(?:<#)?(\d{17,19})>?$/,
      emoji: /^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/,
      role: /^(?:<@&)?(\d{17,19})>?$/,
      snowflake: /^(\d{17,19})$/
    },
    defaultPrefix: `ub!`, // Default prefix for activating bot commands if not set in guild settings.
    token: ``, // Bot user token
    clientOwner: ``, // Snowflake ID of the bot owner
    guildBlacklist: [], // Array of guild IDs that should not be allowed to use this bot
  },

  baseURL: `https://example.com` // Base URL for the REST API

};
