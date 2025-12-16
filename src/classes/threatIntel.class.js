class ThreatIntel {
    constructor() {
        this.abuseChUrl = "https://urlhaus-api.abuse.ch/v1/urls/recent/";
        this.threats = [];
    }

    async fetchThreats() {
        try {
            const abuseChResponse = await this.fetchAbuseCh();
            this.threats = this.parseThreats(abuseChResponse);
        } catch (error) {
            // Do nothing
        }
    }

    async fetchAbuseCh() {
        const response = await fetch(this.abuseChUrl);
        return response.json();
    }

    parseThreats(abuseChData) {
        const threats = [];

        // Parse Abuse.ch data
        if (abuseChData.urls) {
            abuseChData.urls.forEach(url => {
                threats.push({
                    source: "Abuse.ch",
                    url: url.url,
                    threat: url.threat,
                    tags: url.tags,
                    date: url.date
                });
            });
        }

        return threats;
    }
}

module.exports = {
    ThreatIntel
};
