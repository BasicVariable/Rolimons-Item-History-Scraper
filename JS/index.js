const fs = require("node:fs");

const yaml = require("js-yaml");
const proxyAgent = require("https-proxy-agent");

// ---
const scrape = require("./subFiles/scrape.js");
const { config } = require("node:process");
// ---

global.reactiveDelay = (ms, reaction) => new Promise(res => {
    setTimeout(async () => {
        if (typeof reaction == "function") res(await reaction());
        res()
    }, ms)
});

const fixTime = (difference) => {
    const timer = {
        months: Math.floor(difference / (1000 * 60 * 60 * 24 * 30)),
        days: Math.floor(difference / (1000 * 60 * 60 * 24) % 30),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };

    // Hopefully it doesn't actually take months lmao (taken for Codi bot's code)
    return `${timer.months}m:${timer.days}d:${timer.hours}h:${timer.minutes}m:${timer.seconds}s`
};

const getItems = async () => {
    try{
        var res = await fetch("https://www.rolimons.com/itemapi/itemdetails")
            .catch(err => console.log(err));
        if (!res || res.status != 200) return;
        
        var json = await res.json();
        if (json.items){
            return Object.keys(json.items)
        }
    }catch(err){
        console.log(err);
        return
    }
};

fs.readFile("../config.yml", 'utf-8', async (err, res) => {
    if (err) {
        console.log("Failed to read config.yml", err);
        await reactiveDelay(20_000, process.exit)
    };
    
    try{
        config = yaml.load(res)
    }catch(err){
        console.log("Failed to parse yaml", err);
        await reactiveDelay(20_000, process.exit)
    };

    const startTime = Date.now(), itemIds = await getItems();

    let proxies = config.proxies.split("\n") || [];
    for (proxy of proxies){
        // webshare proxy support
        if (!proxies.includes("@")){
            let parts = proxy.split(':');
            proxy = `${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`
        };

        const proxyIndex = proxies.indexOf(proxy), agent = new proxyAgent(proxy);
        if (!agent) {
            console.log(`Proxy ${proxy} is invalid :(`);
            proxies.splice(proxyIndex, 1);
            continue
        };

        proxies.splice(proxyIndex, 1);
        proxies.push(proxy)
    };
    console.log(`Using ${proxies.length} of your proxies >`)

    if (proxies.length < 1) {
        console.log(`\tScraping ${itemIds.length} items on local ip`);
        await scrape(itemIds)
    };

    let maxLoad = Math.ceil(itemIds/proxies), dividedLoad = proxies.reduce((accumulator, current, index) => {
        const loadIndex = Math.floor(index/maxLoad)

        if(!accumulator[loadIndex]) accumulator[loadIndex] = [];
        accumulator[loadIndex].push(current);

        return accumulator
    }, []);

/* 
    Future basic PLEASE remember to add \t to next logs: 

    `\tScraping ${itemIds.length} on ${proxy}`
*/
    let promises = [];
    for (load of dividedLoad) promises.push(
        new Promise(async (res) => res(await scrape(load, proxies.shift(), config)))
    );
    await Promise.all(promises);

    console.log(`Finished scraping ${itemIds}\nTook ${fixTime(Date.now() - startTime)}\nctrl/cmd + c to close`);
    while (true) {await reactiveDelay(5000)}
})