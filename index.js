// Blacklist Bot Dev by !*369xv

const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

const TOKEN = 'TOKEN BOT';
const OWNER_ID = 'OWNER ID';

const bannedUsers = new Map();
let ownerId = OWNER_ID;
const ownerList = new Set([OWNER_ID]);

client.once('ready', () => {
    console.log(`${client.user.tag} est en ligne !`);
    setStreamingActivity('Regardez en direct !', 'https://twitch.tv/votre_chaine');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member, guild } = interaction;

    if (commandName === 'bl') {
        const userId = options.getString('id');
        const reason = options.getString('raison') || 'Aucune raison spécifiée';
        let targetMember = interaction.guild.members.cache.get(userId);

        if (!targetMember) {
            try {
                targetMember = await interaction.guild.members.fetch(userId);
            } catch (error) {
                return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
            }
        }

        if (!targetMember) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });

        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de bannir.", ephemeral: true });
        }

        try {
            await targetMember.ban({ reason: reason });
            interaction.reply({ content: `${targetMember.user.tag} a été banni pour la raison suivante : ${reason}.` });

            bannedUsers.set(userId, { userTag: targetMember.user.tag, reason: reason, bannedBy: member.user.tag });

            const dmMessage = `${targetMember.user}, vous avez été banni de **${guild.name}** par ${member.user.tag} pour la raison suivante : ${reason}`;
            try {
                await targetMember.send(dmMessage);
            } catch (error) {
                console.error(`Impossible d'envoyer un message privé à ${targetMember.user.tag}: ${error.message}`);
            }
        } catch (error) {
            console.error(`Erreur lors du bannissement de ${targetMember.user.tag}: ${error.message}`);
            return interaction.reply({ content: `Impossible de bannir ${targetMember.user.tag}.`, ephemeral: true });
        }
    }

    else if (commandName === 'unbl') {
        const userId = options.getString('id');

        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de débannir.", ephemeral: true });
        }

        try {
            await guild.members.unban(userId);
            interaction.reply({ content: `L'utilisateur avec l'ID ${userId} a été débanni.` });

            const bannedUser = bannedUsers.get(userId);
            if (bannedUser) {
                const dmMessage = `${bannedUser.userTag}, vous avez été débanni de **${guild.name}** par ${member.user.tag}.`;
                try {
                    await client.users.send(userId, dmMessage);
                } catch (error) {
                    console.error(`Impossible d'envoyer un message privé à ${bannedUser.userTag}: ${error.message}`);
                }
                bannedUsers.delete(userId);
            }
        } catch (error) {
            console.error(`Erreur lors du débannissement de l'utilisateur avec l'ID ${userId}: ${error.message}`);
            return interaction.reply({ content: `Impossible de débannir l'utilisateur avec l'ID ${userId}.`, ephemeral: true });
        }
    }

    else if (commandName === 'owner') {
        const userId = options.getString('id');
        let targetMember = interaction.guild.members.cache.get(userId);

        if (!targetMember) {
            try {
                targetMember = await interaction.guild.members.fetch(userId);
            } catch (error) {
                return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
            }
        }

        if (!targetMember) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });

        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de définir un nouveau propriétaire.", ephemeral: true });
        }

        ownerList.add(userId);
        interaction.reply({ content: `${targetMember.user.tag} est maintenant un propriétaire.` });
    }

    else if (commandName === 'unowner') {
        const userId = options.getString('id');
        let targetMember = interaction.guild.members.cache.get(userId);

        if (!targetMember) {
            try {
                targetMember = await interaction.guild.members.fetch(userId);
            } catch (error) {
                return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
            }
        }

        if (!targetMember) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });

        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de retirer le statut de propriétaire.", ephemeral: true });
        }

        ownerList.delete(userId);
        interaction.reply({ content: `${targetMember.user.tag} n'est plus un propriétaire.` });
    }

    else if (commandName === 'ownerlist') {
        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de voir la liste des propriétaires.", ephemeral: true });
        }

        const ownerListArray = Array.from(ownerList);
        const ownerListMessage = ownerListArray.map(ownerId => `<@${ownerId}>`).join(', ') || 'Aucun propriétaire défini.';
        interaction.reply({ content: `Liste des propriétaires : ${ownerListMessage}`, ephemeral: true });
    }

    else if (commandName === 'bl_list') {
        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de voir la liste des utilisateurs bannis.", ephemeral: true });
        }

        const bannedList = Array.from(bannedUsers.values()).map(user => `${user.userTag} (banni par ${user.bannedBy} pour la raison : ${user.reason})`).join('\n');
        if (bannedList) {
            interaction.reply({ content: `Liste des utilisateurs bannis :\n${bannedList}`, ephemeral: true });
        } else {
            interaction.reply({ content: 'Aucun utilisateur banni.', ephemeral: true });
        }
    }

    else if (commandName === 'stream') {
        const streamName = options.getString('name');
        const streamURL = 'https://twitch.tv/votre_chaine';

        if (!ownerList.has(member.id)) {
            return interaction.reply({ content: "Vous n'avez pas la permission de modifier l'activité du bot.", ephemeral: true });
        }

        const urlPattern = /^(https?:\/\/(?:www\.)?(twitch\.tv|youtube\.com|facebook\.com)\/[\w-]+)/i;
        if (!urlPattern.test(streamURL)) {
            return interaction.reply({ content: 'URL invalide pour l\'activité STREAMING. Activité non mise à jour.', ephemeral: true });
        }

        client.user.setPresence({
            activities: [{ name: streamName, type: ActivityType.Streaming, url: streamURL }],
            status: 'dnd',
        });

        interaction.reply({ content: `L'activité du bot a été mise à jour : ${streamName}` });
    }

    else if (commandName === 'help') {
        const helpMessage = `
        **Commandes disponibles :**
        - \`/bl <id> [raison]\` : Bannit un utilisateur.
        - \`/unbl <id>\` : Débannit un utilisateur.
        - \`/owner <id>\` : Définit un utilisateur comme propriétaire.
        - \`/unowner <id>\` : Retire le statut de propriétaire d'un utilisateur.
        - \`/ownerlist\` : Affiche la liste des propriétaires.
        - \`/bl_list\` : Affiche la liste des utilisateurs bannis.
        - \`/stream <name>\` : Modifie l'activité du bot pour indiquer qu'il est en train de streamer.
        - \`/help\` : Affiche cette page d'aide.
        `;
        interaction.reply({ content: helpMessage, ephemeral: true });
    }
});

client.on('ready', async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName('bl')
            .setDescription('Bannit un utilisateur.')
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('ID de l\'utilisateur à bannir.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('raison')
                    .setDescription('Raison du bannissement.')
                    .setRequired(false)
            ),

        new SlashCommandBuilder()
            .setName('unbl')
            .setDescription('Débannit un utilisateur.')
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('ID de l\'utilisateur à débannir.')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('owner')
            .setDescription('Définit un utilisateur comme propriétaire.')
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('ID de l\'utilisateur à définir comme propriétaire.')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('unowner')
            .setDescription('Retire le statut de propriétaire d\'un utilisateur.')
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('ID de l\'utilisateur dont retirer le statut de propriétaire.')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('ownerlist')
            .setDescription('Affiche la liste des propriétaires.'),

        new SlashCommandBuilder()
            .setName('bl_list')
            .setDescription('Affiche la liste des utilisateurs bannis.'),

        new SlashCommandBuilder()
            .setName('stream')
            .setDescription('Modifie l\'activité du bot pour indiquer qu\'il est en train de streamer.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Nom du stream.')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Affiche la page d\'aide.')
    ].map(command => command.toJSON());

    const guild = client.guilds.cache.first();
    if (guild) {
        await guild.commands.set(commands);
        console.log('Commandes enregistrées avec succès !');
    }
});

client.login(TOKEN);

function setStreamingActivity(name, url) {
    const urlPattern = /^(https?:\/\/(?:www\.)?(twitch\.tv|youtube\.com|facebook\.com)\/[\w-]+)/i;

    if (!urlPattern.test(url)) {
        console.log('URL invalide pour l\'activité STREAMING. Activité non mise à jour.');
        return;
    }

    client.user.setPresence({
        activities: [
            {
                name: name,
                type: ActivityType.Streaming,
                url: url
            }
        ],
        status: 'online'
    });
}
