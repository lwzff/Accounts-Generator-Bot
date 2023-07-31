const { Client, SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require("discord.js");

module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
        .setName("generate")
        .setDescription("Generate command.")
        .addStringOption(option =>
            option
                .setName('service')
                .setDescription('The service you want to generate an account from.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        ,

    /**
     * @param { Client } client
     * @param { CommandInteraction } interaction
     */
    async autocomplete(interaction, client) {
        const { member, options } = interaction;
		const focusedOption = options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'service') {
            const guild_services = await client.models.services.find({ guild_id: interaction.guild.id });
            guild_services.forEach( (service) => {
                if (member._roles.includes(service.role)) {
                    choices.push(service.service[0].toUpperCase() + service.service.slice(1));
                }
            });
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
    async execute (interaction, client) {

        const { user, guild, options } = interaction;
        const service_name = options.getString('service');

        console.log(`${user.tag} executed /generate.`);

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

        await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Generating an account..`, ephemeral: false });

        const find_user = await client.models.users.findOne({ guild_id: guild.id, user_id: user.id });
        var date = Math.floor(new Date().getTime() / 1000);
        if (find_user) {
            if (date < find_user.next_gen) {
                console.log(`${user.tag} is still on cooldown.`);
                if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) tried to generate an account from **${service_name}**, but **__user is on cooldown__**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                return interaction.editReply({ content: `Unable to generate an account. \nError: \`\`This user is still on cooldown\`\`. \nCooldown: <t:${find_user.next_gen}:R>`, ephemeral: false });
            }
        }
        else await client.models.users.create({ guild_id: guild.id, user_id: user.id, next_gen: 'None' });

        const service_exist = await client.models.services.findOne({ guild_id: guild.id, service: service_name.toLowerCase() });
        if (!service_exist) return interaction.editReply({ content: `Unable to find this service. \nError: \`\`This service doesn't exist\`\`.`, ephemeral: false });

        const find_service_account = await client.models.accounts.findOne({ guild_id: guild.id, service: service_name.toLowerCase() }).catch( async err => {
            setTimeout( async () => {
                console.log(err);
                await interaction.editReply({ content: `${err}` });
            }, 2000);
        });

        if (!find_service_account) {
            console.log(`${user.tag} requested service is empty.`);
            if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) tried to generate an account from **${service_name}**, but **__service is empty__**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
            return interaction.editReply({ content: `Unable to find an account. \nError: \`\`This service doesn't have accounts in stock\`\`.`, ephemeral: false });
        }

        const creds_embed = new EmbedBuilder().setColor('2B2D31').setTitle('Account credentials').setDescription(`**Account name/email):** \n> ${find_service_account.account_name} \n**Password:** \n> ${find_service_account.account_password}`);
        const dm_sent = await user.send({ embeds: [creds_embed] }).catch( async err => {
            setTimeout( async () => {
                console.log(err);
                const embed = new EmbedBuilder().setColor('2B2D31').setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Enable your DMs to receive accounts credentials.`);
                await interaction.editReply({ content: ``, embeds: [embed] });
            }, 2000);
        });

        if (dm_sent) {
            await find_service_account.deleteOne();
            var date = new Date();
            date.setHours(date.getHours() + parseInt(client.config.gen_cooldown_hours));
            date.setMinutes(date.getMinutes() + parseInt(client.config.gen_cooldown_minutes));
            date.setSeconds(date.getSeconds() + parseInt(client.config.gen_cooldown_seconds));
            const next_gen_time = Math.floor(date.getTime() / 1000);
            await client.models.users.updateOne({ guild_id: guild.id, user_id: user.id },{ next_gen: next_gen_time });
        }

        setTimeout( async () => {
            if (!find_service_account) return;
            if (!dm_sent) return;
        
            const embed = new EmbedBuilder()
            .setColor('2B2D31')
            .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Your account credentials has been sent in DMs.`);
        
            await interaction.editReply({ content: ``, embeds: [embed], ephemeral: false });
            console.log(`${user.tag} account credentials has been sent.`);
            if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) generated account **${find_service_account.account_name}** in **${service_name}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
        }, 3000);




    
    }
}