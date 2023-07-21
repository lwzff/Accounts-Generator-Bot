const { Client, SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require("discord.js");

module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
        .setName("accounts")
        .setDescription("Accounts command.")
        .setDefaultMemberPermissions(0)
        .addSubcommand(command =>
            command
                .setName('add')
                .setDescription('Add an account to a service.')
                .addStringOption(option => 
                    option
                        .setName('service')
                        .setDescription('The service you want to add an account in.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option => 
                    option
                        .setName('account-name')
                        .setDescription('The account login name (or email).')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option
                        .setName('account-password')
                        .setDescription('The account password.')
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName('clear')
                .setDescription('Clear all accounts from a service.')
                .addStringOption(option => 
                    option
                        .setName('service')
                        .setDescription('The service you want to clear.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName('import')
                .setDescription('Import accounts from a .TXT file in a service.')
                .addStringOption(option => 
                    option
                        .setName('service')
                        .setDescription('The service you want to add the accounts in.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addAttachmentOption(option =>
                    option
                        .setName('account-file')
                        .setDescription("The .TXT file with all the accounts (ex: name:password).")
                        .setRequired(true)
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
                console.log(`${user.tag} executed /accounts add.`);
                const account_name = options.getString('account-name');
                const account_password = options.getString('account-password');
                await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Adding your account..`, ephemeral: true });
    
                const service_exist = await client.models.services.findOne({ guild_id: guild.id, service: service_name.toLowerCase() });
                if (!service_exist) return interaction.editReply({ content: `Unable to find this service. \nError: \`\`This service doesn't exist\`\`.`, ephemeral: true });

                const create_account = await client.models.accounts.create({ guild_id: guild.id, service: service_name.toLowerCase(), account_name: account_name, account_password: account_password }).catch( async err => {
                    setTimeout( async () => {
                        console.log(err);
                        await interaction.editReply({ content: `${err}` });
                    }, 2000);
                });

                setTimeout( async () => {
                    if (!create_account) return;
                
                    const embed = new EmbedBuilder()
                    .setColor('2B2D31')
                    .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Your account **${account_name}**:**${account_password}** has been created in **${service_name}**.`);
                
                    await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
                    if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) created a new acount **${account_name}** for the service **${service_name}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                }, 3000);

                break;
            }
            
            case 'clear': {
                console.log(`${user.tag} executed /accounts clear.`);
                await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Clearing all accounts in the selected service..`, ephemeral: true });
    
                const service_exist = await client.models.services.findOne({ guild_id: guild.id, service: service_name.toLowerCase() });
                if (!service_exist) return interaction.editReply({ content: `Unable to clear accounts from this service. \nError: \`\`This service doesn't exist\`\`.`, ephemeral: true });

                const find_service_accounts = await client.models.accounts.find({ guild_id: guild.id, service: service_name.toLowerCase() }).catch( async err => {
                    setTimeout( async () => {
                        console.log(err);
                        await interaction.editReply({ content: `${err}` });
                    }, 2000);
                });

                if (find_service_accounts.length === 0) return interaction.editReply({ content: `Unable to clear accounts from this service. \nError: \`\`This service doesn't have accounts registered\`\`.`, ephemeral: true });

                find_service_accounts.forEach( async (acc) => {
                    await acc.deleteOne();
                });

                setTimeout( async () => {
                    if (!find_service_accounts) return;
                
                    const embed = new EmbedBuilder()
                    .setColor('2B2D31')
                    .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} All the accounts (x${find_service_accounts.length}) have been deleted from service **${service_name}**.`);
                
                    await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
                    if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) cleared all the accounts (x${find_service_accounts.length}) from the service **${service_name}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                }, 3000);

                break;
            }

            case 'import': {
                console.log(`${user.tag} executed /accounts import.`);
                await interaction.reply({ content: `${(classic_load_emoji === undefined) ? '🔄️' : `${classic_load_emoji}`} Importing accounts in the selected service..`, ephemeral: true });

                const attachment = interaction.options.getAttachment('account-file');
                if (!attachment.url.endsWith('.txt')) {
                    console.log(`${user.tag} provided file is not .TXT.`);
                    if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) tried to import accounts in the service **${service_name}**, but **provided file is not a .TXT**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                    return interaction.editReply({ content: `Unable to import accounts in this service. \nError: \`\`Only accepting .TXT files.\`\`.`, ephemeral: true });
                }
            
                const read_file = await fetch(attachment.attachment);
                const file_to_text = await read_file.text();
                const accounts = file_to_text.trim().split("\n");

                const total_acc_before = await client.models.accounts.find({ guild_id: guild.id, service: service_name.toLowerCase() });

                await accounts.forEach( async (acc) => {
                    const account_already_exist = await client.models.accounts.findOne({ guild_id: guild.id, service: service_name.toLowerCase(), account_name: acc.split(':')[0] });
                    if (!account_already_exist) await client.models.accounts.create({ guild_id: guild.id, service: service_name.toLowerCase(), account_name: acc.split(':')[0], account_password: acc.split(':')[1] });
                });


                setTimeout( async () => {
                    const total_acc_after = await client.models.accounts.find({ guild_id: guild.id, service: service_name.toLowerCase() });
                    const embed = new EmbedBuilder()
                    .setColor('2B2D31')
                    .setDescription(`${(check_emoji === undefined) ? '✅' : `${check_emoji}`} Imported ${(total_acc_after.length - total_acc_before.length)}/${accounts.length} (other accounts are already existing) in the service **${service_name}**.`);
                
                    await interaction.editReply({ content: ``, embeds: [embed], ephemeral: true });
                    if (client.config.enable_logs) await guild.channels.cache.get(client.config.logs_channel_id).send({ content: `${user.tag} (${user.id}) imported ${(total_acc_after.length - total_acc_before.length)}/${accounts.length} accounts in the service **${service_name}**.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                }, 3000);

            }
        }

    }
}