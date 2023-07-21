const { Client, SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require("discord.js");

module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
        .setName("services")
        .setDescription("Services command.")
        .setDefaultMemberPermissions(0)
        .addSubcommand(command =>
            command
                .setName('add')
                .setDescription('Add a service.')
                .addStringOption(option => 
                    option
                        .setName('service')
                        .setDescription('The service you want to add.')
                        .setRequired(true)
                )
                .addRoleOption(option => 
                    option
                        .setName('role')
                        .setDescription('The role that can generate account from this service.')
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName('remove')
                .setDescription('Remove a service.')
                .addStringOption(option => 
                    option
                        .setName('service')
                        .setDescription('The service you want to remove.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        ,

    /**
     * @param { Client } client
     * @param { CommandInteraction } interaction
     */
    async autocomplete(interaction, client) {
		const focusedOption = interaction.options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'service') {
            const guild_services = await client.models.services.find({ guild_id: interaction.guild.id });
            guild_services.forEach( (service) => {
                choices.push(service.service[0].toUpperCase() + service.service.slice(1));
            });
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
    async execute (interaction, client) {

        const { user, guild, options } = interaction;
        const sub = options.getSubcommand();
        const service_name = options.getString('service');

        // Find Emojis
        let classic_load_emoji = guild.emojis.cache.find(emoji => emoji.name === 'GenClassicLoadEmoji');
        if (!classic_load_emoji) {
            const emoji = await guild.emojis.create({ attachment: 'https://cdn.discordapp.com/emojis/1125786520092155904.gif?size=96', name: 'GenClassicLoadEmoji' }).catch( (err) => {
                return classic_load_emoji = '🔄️';
            });
            classic_load_emoji = emoji;
        }
        let check_emoji = guild.emojis.cache.find(emoji => emoji.name === 'GenCheckEmoji');
        if (!check_emoji) {
            const emoji = await guild.emojis.create({ attachment: 'https://cdn.discordapp.com/emojis/1125788132814618767.gif?size=96', name: 'GenCheckEmoji' }).catch( (err) => {
                return check_emoji = '✅';
            });
            check_emoji = emoji;
        }

        switch (sub) {
            case 'add': {
                console.log(`${user.tag} executed /services add.`);
                const role = options.getRole('role');

                await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Creating your service..`, ephemeral: true });
    
                const service_exist = await client.models.services.findOne({ guild_id: guild.id, service: service_name.toLowerCase() });
                if (service_exist) return interaction.editReply({ content: `Unable to create this service. \nError: \`\`This service already exist\`\`.`, ephemeral: true });

                const create_service = await client.models.services.create({ guild_id: guild.id, service: service_name.toLowerCase(), role: role.id }).catch( async err => {
                    setTimeout( async () => {
                        console.log(err);
                        await interaction.editReply({ content: `${err}` });
                    }, 2000);
                });

                setTimeout( async () => {
                    if (!create_service) return;
                
                    const embed = new EmbedBuilder()
                    .setColor('2B2D31')
                    .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Your service **${service_name}** with role <@&${role.id}> has been created.`);
                
                    await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
                    if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) created the service **${service_name}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                }, 3000);

                break;
            }
            
            case 'remove': {
                console.log(`${user.tag} executed /services remove.`);
                await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Removing your service..`, ephemeral: true });
    
                const service_exist = await client.models.services.findOne({ guild_id: guild.id, service: service_name.toLowerCase() });
                if (!service_exist) return interaction.editReply({ content: `Unable to remove this service. \nError: \`\`This service doesn't exist\`\`.`, ephemeral: true });

                const remove_service = await client.models.services.deleteOne({ guild_id: guild.id, service: service_name.toLowerCase() }).catch( async err => {
                    setTimeout( async () => {
                        console.log(err);
                        await interaction.editReply({ content: `${err}` });
                    }, 2000);
                });

                setTimeout( async () => {
                    if (!remove_service) return;
                
                    const embed = new EmbedBuilder()
                    .setColor('2B2D31')
                    .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Your service **${service_name}** has been removed.`);
                
                    await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
                    if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) removed the service **${service_name}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                }, 3000);

                break;
            }
        }

    }
}