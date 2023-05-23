// bibliothèque
const puppeteer = require('puppeteer')
const fs = require('fs')

// fonction qui va formatter le nombre de vue, par exemple "13 k spectateurs" à "13000"
const formatViewers = (value) => {
    const newValue = value.replace(' spectateurs', '').replace(',', '.')
    if (newValue.includes('k')) {
        return parseFloat(newValue) * 1000
    }
    return parseFloat(newValue)
}

// fonction de scraping
async function scrape() {
    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage();
        // lien twitch
        await page.goto(`https://www.twitch.tv/directory?sort=VIEWER_COUNT`);
        // on attend le chargement de la page complète
        await page.waitForSelector('.game-card')
        const games = await page.evaluate(() => {
            // début du scrapping
            const gameElements = Array.from(document.querySelectorAll('.game-card'))
            return gameElements.map((element) => {
                const name = element.querySelector('.tw-card-body h2').textContent
                const viewers = element.querySelector('.tw-card-body p .tw-link').textContent
                return { name, viewers }
            })
        })
        await browser.close()
        return games
    } catch (err) {
        console.log(err)
        return []
    }
}

// main
function main() {
    scrape()
        .then((games) => {
            // on recupere la data existant
            const data = fs.readFileSync('./data.js').toString()
            const res = JSON.parse(data.replace('const data =', ''));
            // heure française par defaut
            const date = new Date()
            const hour = date.getHours().toString().padStart(2, '0');
            // + 1 pour le mois parce que l'index commence à 0
            const now = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0')
            const key = now + ' ' + hour
            res[key] = []
            games.forEach((game) => {
                res[key].push({
                    name: game.name,
                    viewers: formatViewers(game.viewers)
                })
            });
            // on met à jour la data
            fs.writeFileSync('./data.js', 'const data = ' + JSON.stringify(res))
        })
        .catch((err) => {
            console.log(err)
        })
}

main()
setInterval(() => {
    // toutes les heures
    main()
}, 1000 * 60 * 60)