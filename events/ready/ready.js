const { Client, ActivityType, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ready",
    /**
     * @param { Client } client
     */
    async execute (client) {
        console.log('-> Connected to Discord: ' + client.user.tag);
        client.user.setActivity({ name: `all the accounts.`, type: ActivityType.Watching });

        if (client.config.stock_auto_refresh) {

            const gen_stock_channel = await client.guilds.cache.get(client.config.developerGuildId).channels.cache.get(client.config.stock_channel_id);
            
            setInterval( async () => {
                const find_services = await client.models.services.find({ guild_id: client.config.developerGuildId }).sort({ service: 1 });

                let services_embed = new EmbedBuilder().setColor('Blurple').setTitle('Generator stock').setDescription(`Total of ${find_services.length} services.`);
                if (find_services.length === 0) services_embed.setDescription('No services created.');
                else {
                    find_services.forEach( async (service) => {
                        const service_accounts = await client.models.accounts.find({ guild_id: client.config.developerGuildId, service: service.service });
                        services_embed.addFields({ name: `${service.service[0].toUpperCase() + service.service.slice(1)}`, value: `> ${service_accounts.length} accounts.`, inline: false });
                    });
                }    

                await gen_stock_channel.messages.fetch().then(async (messages) => {
                    const botMsg = await messages.filter(m => m.author.id === client.user.id);
                    const botLastMsg = await botMsg.first();
                    if (!botLastMsg) await gen_stock_channel.send({ embeds: [services_embed] }).catch( (err) => { console.log('Unable to send accounts stock embed in channel') });
                    else await botLastMsg.edit({ embeds: [services_embed] }).catch( (err) => { console.log('Unable to edit last message in channel') });
                });
                
            }, client.config.auto_refresh_rate);


        }
        
    }
}