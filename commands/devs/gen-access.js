const { Client, SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require("discord.js");

module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
        .setName("gen-access")
        .setDescription("Add someone to the generator.")
        .setDefaultMemberPermissions(0)
        .addUserOption(option => option.setName('user').setDescription('Target an user.').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Duration of the access.').setRequired(true).setAutocomplete(true))
        .addStringOption(option => option.setName('service').setDescription('The selected service.').setRequired(true).setAutocomplete(true))
        ,

    /**
     * @param { Client } client
     * @param { CommandInteraction } interaction
     */
    async autocomplete(interaction, client) {
        const { guild, options } = interaction;
		const focusedOption = options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'duration') {
            choices = ['3 Days', '1 Week', '1 Month', 'Lifetime'];
		}
        else if (focusedOption.name === 'service') {
            const guild_services = await client.models.services.find({ guild_id: guild.id });
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
        const { guild, options } = interaction;
        const selected_user = options.getMember("user");
        const duration = options.getString("duration");
        const service_name = options.getString("service")

        console.log(`${interaction.user.tag} executed /gen-access.`);

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

        await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Adding user to generator..`, ephemeral: true });

        const findUserInDb = await client.models.gen_access.findOne({ guild_id: guild.id, user_id: selected_user.user.id, service: service_name.toLowerCase() });
        if (findUserInDb) return interaction.editReply({ content: `❌ Sorry, user is already in database. Plan expires: <t:${findUserInDb.access_end_time}>.`, ephemeral: true });

        var date = new Date();

        if (duration === "3 Days") date.setDate(date.getDate() + 3);
        else if (duration === "1 Week") date.setDate(date.getDate() + 7);
        else if (duration === "1 Month") date.setMonth(date.getMonth() + 1);
        else if (duration === "Lifetime") date.setMonth(date.getMonth() + 999);

        const endTime = Math.floor(date.getTime() / 1000);

        await client.models.gen_access.create({ guild_id: guild.id, user_id: selected_user.user.id, access_end_time: endTime, service: service_name.toLowerCase() });
        
        const find_service_settings = await client.models.services.findOne({ guild_id: guild.id, service: service_name.toLowerCase() });
        const add_user_role = await selected_user.roles.add(find_service_settings.role).catch( async err => {
            setTimeout( async () => {
                console.log(err);
                const embed = new EmbedBuilder().setColor('2B2D31').setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Can't add the role associated with the service, to the user.`);
                await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
            }, 2000);
        }); 

        setTimeout( async () => {
            if (!add_user_role) return;
        
            const embed = new EmbedBuilder()
            .setColor('2B2D31')
            .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} User has now access to the generator for: <t:${endTime}:R>.`);
        
            await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
            console.log(`${selected_user.user.tag} has been added to generator.`);
            if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${selected_user.user.tag} (${selected_user.user.id}) has now access to the generator for <t:${endTime}:R> by **${interaction.user.tag}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
        }, 3000);
    }
}