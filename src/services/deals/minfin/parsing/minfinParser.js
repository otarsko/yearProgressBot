import Request from 'request';
import Cheerio from 'cheerio';
import stripTags from 'striptags';
import removeNewline from 'newline-remove';
import condenseWhitespace from 'condense-whitespace';
import agents from 'fake-user-agent';
import Promise from 'bluebird';
import RequestPromise from 'request-promise';
import Deal from '../deal.model';

export default class MinfinParser {

    //todo: move class names to separate config, use callback, implement
    getDeals(url) {
        if (!url) {
            console.error("Got undefined url");
            return Promise.reject(new Error('Undefined url'));
        }

        var options = {
            url: url,
            headers: {
                'User-Agent': agents.IE9
            },
            transform: (body) => {
                return Cheerio.load(body);
            }
        };
        return new RequestPromise(options).then($ => {
            var deals = [];
            $('.js-au-deal').each(function(i, elem) {
                var bidId = $(elem).data("bid");
                var rate = $(elem).find(".au-deal-currency") && ($(elem).find(".au-deal-currency").html() || 0);
                if (rate && bidId) {
                    var time = $(elem).find(".au-deal-time").html();
                    var sum = $(elem).find(".au-deal-sum").html();
                    sum = stripTags(sum);
                    var message = $(elem).find(".js-au-msg-wrapper").html();
                    message = condenseWhitespace(removeNewline(message));
                    deals.push(new Deal(bidId, rate, time, sum, message));
                }
            });
            if (deals.length === 0) {
                console.error("No deals found for url: " + url);
                return Promise.reject(new Error('No deals found'));
            }
            return deals;
        });
    }
}