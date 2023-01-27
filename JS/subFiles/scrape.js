// Never making that joke about too many while loops again...

const proxyAgent = require("https-proxy-agent");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cheerio = require("cheerio");
const { QuickDB } = require("quick.db");

const rapDB = new QuickDB({ filePath: '../raplogs_json.sqlite' });

const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...options });
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
};

const getItem = async (ID, agent, conditions) => {
    while (true){
        let response = await fetchTimeout(`https://www.rolimons.com/item/${ID}`, conditions.requestTimeout, {
            agent: agent || null
        }).catch(err => console.log(err));

        if (!response) continue;

        if (response.status != 200){
            if (response.status == 429 && conditions.requestUntil429 && conditions.ignore == false) await reactiveDelay(conditions.delayBetweenPages);
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
    let 
        agent = (!proxy)?
            null    
            :        
            new proxyAgent(`${(!proxy.includes("https"))?"https://":""}${proxy}`),
        itemRapHistory = []
    ;

    const fail = async (ID) => {
        itemIds.push(ID);
        console.log("   ! Failed to load item page: ", ID);
        await reactiveDelay(30_000)
    };

    while (itemIds.length > 1){
        let ID = itemIds.shift(), itemPage = await getItem(ID, agent, config.ratelimit);
        if (!itemPage){
            await fail();
            continue
        };

        let scriptContent, $ = cheerio.load(itemPage);
        $("script").each((index, current) => {
            let scriptElement = $(current)[0];

            if (!scriptElement || !scriptElement.firstChild) return;

            let content = $(current)[0].firstChild.data;
            // Checks for the variable in the script
            if (!content.includes("history_data")) return;

            content = content.replace(/var\b/g, ""); content = content.replace(/\s/g, "");

            scriptContent = {
                itemDetailsData: JSON.parse(content.match(/item_details_data=(.*?})/)[1]),
                itemHistory: JSON.parse(content.match(/history_data=(.*?})/)[1])
            }
        });

        if (!scriptContent){
            await fail();
            continue
        };

        // Rolimon makes a timestamp (in seconds) for each update of data 
        let 
            timeStamps = scriptContent.itemHistory.timestamp,
            rapHistory = scriptContent.itemHistory.rap,
            lastStamp = 0,
            dayConverted = 0 
        ;

        // puts all old rap data at start of array skips timestamps by day periods (also is it timeStamp or timestamp? like are they seperate idk)
        for (let i = 1; true; i++){
            let 
                timeStamp = timeStamps[timeStamps.length - i],
                rapOfPeriod = rapHistory[timeStamps.length - i]
            ;

            if (!timeStamp || !rapOfPeriod) break;
            if (lastStamp - timeStamp < 86400 && lastStamp != 0) continue;

            itemRapHistory.unshift(rapOfPeriod);
            lastStamp = timeStamp;
            dayConverted++;

            // stops after a year of data is converted (I didn't need that much)
            if (dayConverted > 365) break
        };

        console.log(`\tFinished scraping ${ID}`);
        await reactiveDelay(config.ratelimit.delayBetweenPages)
    };

    await rapDB.set(ID, rapHistory)
};

module.exports = scrape