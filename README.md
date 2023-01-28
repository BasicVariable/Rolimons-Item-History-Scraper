# WARNING
Don't use unstable/free proxies on this, I haven't finished it yet and need to add better catching for issues with proxies.

# Rolimons-Item-History-Scraper
Scrapes all item rap history on Rolimons, good for building a years worth of rap history as an sql db. 

Scrapes all item pages for a <script> tag and gets the "history_data" variable (string manipulation isn't fun), sorts the data with the timestamps Rolimon
left in the object so that it gets one piece of rap data per day. All the rap data for the past year will be placed in a file called "raplogs_json.sqlite"
with the itemids as keys and their data as an array. *The data in the array goes from oldest -> newest*.

If it idles and you wanna restart it it'll skip all the items you already scraped, if you don't want this to happen delete rapdb.sql.

The config is pretty self explanatory (there are even notes left inside it),
# to setup
Make sure you have the latest LTS version of node.js (18 atm). Fill out the config and run either the run.sh (Linux) or run.bat (Windows) files.
