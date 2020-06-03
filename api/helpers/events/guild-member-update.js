module.exports = {


    friendlyName: 'events.guildMemberUpdate',


    description: 'Discord guild member update event',


    inputs: {
        oldMember: {
            type: 'ref',
            required: true,
            description: "The stats of the guild member prior to update."
        },
        newMember: {
            type: 'ref',
            required: true,
            description: "The new state of the guild member."
        }
    },


    fn: async function (inputs) {
        // Upgrade partial new members to full members
        if (inputs.newMember.partial) {
            await inputs.newMember.fetch();
        }

        const mutedRole = inputs.newMember.guild.roles.resolve(inputs.newMember.guild.settings.muteRole);
        if (mutedRole) {
            var isMuted = (inputs.newMember.roles.cache.get(inputs.newMember.guild.settings.muteRole) ? true : false);

            // Kick the user out of voice channels if they are muted
            if (isMuted && inputs.newMember.voice.channel) {
                inputs.newMember.voice.kick(`User is muted`)
            }

            // If member has muted role and database does not say they are muted, update to say they are
            if (isMuted && !inputs.newMember.settings.muted) {
                Caches.get('members').set([ inputs.newMember.id, inputs.newMember.guild.id ], () => {
                    return { muted: true };
                });

                // Use labeled muted in the database but does not have the mute role
            } else if (!isMuted && inputs.newMember.settings.muted) {
                Caches.get('members').set([ inputs.newMember.id, inputs.newMember.guild.id ], () => {
                    return { muted: false };
                });
            }
        }
    }


};
