const WS_URL = 'wss://gateway.discord.gg/?v=8&encoding=json';

class VCJoiner {
    constructor(token, guildId, channelId, settings = {}) {
        this.token = token;
        this.guildId = guildId;
        this.channelId = channelId;
        this.settings = {
            camera: settings.camera || false,
            mic: settings.mic || false,
            deafen: settings.deafen || false,
            stream: settings.stream || false
        };
        this.ws = null;
        this.heartbeatInterval = null;
        this.connected = false;
    }

    async connect() {
        try {
            this.ws = new WebSocket(WS_URL);
            
            return new Promise((resolve, reject) => {
                this.ws.onmessage = ({ data }) => {
                    const payload = JSON.parse(data);
                    const { op, d } = payload;

                    if (op === 10) {
                        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
                        
                        this.heartbeatInterval = setInterval(() => {
                            if (this.ws?.readyState === WebSocket.OPEN) {
                                this.ws.send(JSON.stringify({ op: 1, d: null }));
                            }
                        }, d.heartbeat_interval);

                        this.ws.send(JSON.stringify({
                            op: 2,
                            d: {
                                token: this.token,
                                properties: {
                                    $os: 'windows',
                                    $browser: 'Discord',
                                    $device: 'desktop'
                                }
                            }
                        }));

                        this.ws.send(JSON.stringify({
                            op: 4,
                            d: {
                                guild_id: this.guildId,
                                channel_id: this.channelId,
                                self_mute: !this.settings.mic,
                                self_deaf: this.settings.deafen,
                                self_video: this.settings.camera,
                                self_stream: this.settings.stream
                            }
                        }));

                        this.ws.send(JSON.stringify({
                            op: 18,
                            d: {
                                type: "guild",
                                guild_id: this.guildId,
                                channel_id: this.channelId,
                                preferred_region: "singapore"
                            }
                        }));

                        this.connected = true;
                        resolve(true);
                        if (this.settings.stream) {
                            this.streamInterval = setInterval(() => {
                                if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
                                    this.ws.close();
                                    this.connect().catch(() => {});
                                }
                            }, 100);
                        }
                    }
                };

                this.ws.onerror = () => {
                    this.cleanup();
                    reject(new Error('Connection failed'));
                };

                this.ws.onclose = () => {
                    this.cleanup();
                };
            });
        } catch (error) {
            this.cleanup();
            throw error;
        }
    }

    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
        this.connected = false;
    }

    async disconnect() {
        this.cleanup();
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                op: 4,
                d: {
                    guild_id: this.guildId,
                    channel_id: null,
                    self_mute: true,
                    self_deaf: false
                }
            }));
            this.ws.close();
        }
        this.ws = null;
    }

    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                op: 4,
                d: {
                    guild_id: this.guildId,
                    channel_id: this.channelId,
                    self_mute: !this.settings.mic,
                    self_deaf: this.settings.deafen,
                    self_video: this.settings.camera,
                    self_stream: this.settings.stream
                }
            }));
        }
    }

    async verifyGuild() {
        try {
            const response = await fetch(`https://discord.com/api/v9/guilds/${this.guildId}`, {
                headers: {
                    'Authorization': this.token
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Server not found or bot is not in the server');
                } else if (response.status === 401) {
                    throw new Error('Invalid token');
                } else if (response.status === 403) {
                    throw new Error('No access to this server');
                }
                throw new Error(`Server verification failed: ${response.status}`);
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    async verifyChannel() {
        try {
            const response = await fetch(`https://discord.com/api/v9/channels/${this.channelId}`, {
                headers: {
                    'Authorization': this.token
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Voice channel not found');
                } else if (response.status === 403) {
                    throw new Error('No access to this voice channel');
                }
                throw new Error(`Channel verification failed: ${response.status}`);
            }

            const channel = await response.json();
            if (channel.type !== 2) {
                throw new Error('This is not a voice channel');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }
}

export { VCJoiner };