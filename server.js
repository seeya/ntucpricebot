const https = require('https');
const Telegraf = require('telegraf');
const cheerio = require('cheerio');
const bot = new Telegraf(process.env.BOT_TOKEN);
const SEARCH_URL = 'https://www.fairprice.com.sg/searchterm/';


bot.start((ctx) => ctx.reply('Welcome to NTUC Price Bot! To use this bot, simply type `@NTUCPriceBot query` at any chat and modify the query to whatever you would like to find. You will receive a list of item pricing.'));
bot.on('inline_query', ({ inlineQuery, answerInlineQuery }) => {
  getQueryPrice(inlineQuery.query, (items) => {
    //https://core.telegram.org/bots/api#inlinequeryresultarticle
    const results = items.map((item) => ({
        id: item.id,        
        type: 'article',
        title: item.name,
        description: `${item.price}, ${item.weight}\n${item.promo}`,
        thumb_url: item.image,
        input_message_content: {
          message_text: `*${item.name}* _${item.weight}_ \n${item.price}\n${(item.promo) ? "\`Promotion: " + item.promo + "\`\n": ""}[IMAGE](${item.image})`,
          parse_mode: 'Markdown'
        }
    }));
    try {
      answerInlineQuery(
        results,
      );
    } catch(err) {
      console.log(err);
    }
  });
});
bot.startPolling()

function getQueryPrice(query, cb) {
  query = query || "green tea";
  https.get(`${SEARCH_URL}${query}`, (r) => {
    let data = '';
    let parsed = [];
    
    r.setEncoding('utf8');
    r.on('data', (chunk) => data += chunk);
    r.on('end', () => {
      const $ = cheerio.load(data);
      $('.product').each((i, e) => {
        const promo = $(e).find(".pdt_promo").text().trim();
        const price = $(e).find(".pdt_C_price").text().trim();
        const discount = $(e).find(".pdt_O_price").text().trim();
        const weight = $(e).find(".pdt_Tweight").text().trim();
        const image = $(e).find("img").attr("src");
        const name = $(e).find(".pdt_name").find("a").text().replace("Full Page", "").trim();
        const id = $(e).find(".pdt_img").find("div").attr("dataci_product");

        if(id != undefined) {
          parsed.push({
            promo: promo,
            price: price,
            discount: discount,
            weight: weight,
            image: image,
            name: name,
            id: id
          })
        }
      });
      
      cb(parsed);
    });
  });
}