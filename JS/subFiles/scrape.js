// Never making that joke about too many while loops again...

const proxyAgent = require("https-proxy-agent");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...options });
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
};

const getItem = async (ID, agent, conditions) => {
    while (true){
        let response = await fetch(`https://www.rolimons.com/item/${ID}`, {
            agent
        }).catch(err => console.log(err));

        if (!response || response.status != 200){
            if (response.status == 429 && conditions.requestUntil429) await reactiveDelay(conditions.delayBetweenPages);
            continue
        };

        try{
            return await response.text()
        }catch(err){
            console.log(err)
        }
    }
};

const scrape = async (itemIds, proxy, config) => {
    const agent = new proxyAgent(`${(!proxy.includes("http"))?"http://":""}${proxy}`);

    while (itemIds.length > 1){
        let ID = itemIds.shift(), itemPage = await getItem(ID, agent, config.ratelimit);
        
    }
};

module.exports = scrape