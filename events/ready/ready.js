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

        // Check gen access users
        setInterval( async () => {
            const genAccessUsers = await client.models.gen_access.find();
            if (!genAccessUsers) return;
            else {
                genAccessUsers.forEach( async genAccessUser => {
                    if (genAccessUser.access_end_time > Math.floor(new Date().getTime() / 1000)) return;
                    const user = await client.guilds.cache.get(client.config.developerGuildId).members.cache.get(genAccessUser.user_id);
                    await user?.roles.remove(genAccessUser.role);
                    await user?.send({ content: `⌛ You have no longer access to the **Accounts Generator**.` }).catch(err => { return; });
                    await client.models.gen_access.deleteMany({
                        access_end_time: genAccessUser.access_end_time,
                        user_id: user.id,
                        guild_id: client.config.developerGuildId
                    });
                    console.log(`${user?.user.tag} (${user?.user.id}) has been removed from the generator access.`);
                    if (client.config.enable_logs) await client.guilds.cache.get(client.config.developerGuildId).channels.cache.get(client.config.logs_channel_id).send({ content: `${user?.user.tag} (${user?.user.id}) has **no more access** to the generator.` }).catch( (err) => { console.log('Unable to send logs in channel') });
                });
            }
        }, 1000 * 5);
        
    }
}