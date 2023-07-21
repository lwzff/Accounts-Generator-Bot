
# Flop Engine

Except this shitty name, this bot is a simple "accounts generator" for your Discord server.

ℹ️ *Note: This bot doesn't generate/create/find accounts itself, you need to provide the accounts.*



## Installation

First, download the bot through git (or download it with .zip).

```bash
  git clone https://github.com/lwzff/Accounts-Generator-Bot.git
```

Then, install Node-JS and install all the dependencies.

```bash
  npm install
```

When everything is done, create a MongoDB database.

- [MongoDB website](https://www.mongodb.com/)

In my case, I use M0 Free Cluster (512 MB storage) from AWS in my region (France).
For the region, if your bot is self-hosted choose the same region as yours. If the bot is on AWS or something else, choose the region where the host is running your bot from.

Edit the **config.json** with :
- **developerGuildId**, the guild ID the bot is on.
- **enable_logs**, to enable channel logs.
- **logs_channel_id**, the channel logs.
- **stock_channel_id**, the channel where accounts stocks will appears.
- **stock_auto_refresh**, true or false to enable or disable it (auto refreshing the stock embed).
- **auto_refresh_rate**, 60000 (miliseconds) by default so refreshing the embed every 60 secs.
- **gen_cooldown_hours**, user cooldown in hours (default is 1).
- **gen_cooldown_minutes**, user cooldown in minutes (default is 0).
- **gen_cooldown_seconds**, user cooldown in seconds (default is 0).

When everything is ready, run the bot.

```bash
  node .
```
or
```bash
  node index.js
```
  
## Environment Variables

To run this project, you will need to add the following environment variables to your **.env** file.

`BOT_TOKEN`=`my_discord_bot_token`

Follow [this guide](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) for more information on how to create a bot and getting a token.

`DATABASE`=`my_mongodb_cluster_url`


## License

You can:
- Edit the code as you want.

You **can't**:
- Say that **you** made the bot.
- Write that **you** made the bot.

