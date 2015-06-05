var fs = require('fs');
var request = require('superagent');
var cheerio = require('cheerio');
var xlsx = require('node-xlsx');
var randomIp = require('chinese-random-ip');
var async = require('async');
var urls = require('./data.json');
var result = [
    ['编号', '用户名', '读过书籍', '书籍简介', '大众标签']
];

function getBookInfo(url, index, callback) {
    var ipAddress = randomIp.getChineseIp();
    var data = [];
    request.get(url)
        .set('X-Real-IP', ipAddress)
        .set('X-Forwarded-For', ipAddress)
        .set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2414.0 Safari/537.36')
        .set('Cookie', 'bid="MWRYk/7JW0w"; ll="118297"; dbcl2="65043156:cjbfVjCNqBU"; ap=1; ck="9ppw"; push_noty_num=0; push_doumail_num=2; __utmt_douban=1; __utma=30149280.597269190.1430889598.1433399318.1433468754.4; __utmb=30149280.5.10.1433468754; __utmc=30149280; __utmz=30149280.1430892868.2.2.utmcsr=tiye.me|utmccn=(referral)|utmcmd=referral|utmcct=/; __utmv=30149280.6504; __utmt=1; __utma=81379588.1087632970.1433399354.1433399354.1433468754.2; __utmb=81379588.5.10.1433468754; __utmc=81379588; __utmz=81379588.1433399354.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _pk_id.100001.3ac3=78a4e2cdd1723acd.1433399354.2.1433471658.1433399477.; _pk_ses.100001.3ac3=*')
        .end(function(err, res) {
            var $ = cheerio.load(res.text);
            var userName = $('#db-usr-profile').find('h1').text().replace(/读过的书\(\d+\)/, '');
            var $books = [];
            $('.subject-item').each(function(idx, el) {
                $books.push($(el));
            });
            async.each($books, function($el, cb) {
                var ipAddress2 = randomIp.getChineseIp();
                var $title = $el.find('h2 a');
                var bookName = $title.text();
                var tags = $el.find('.tags').text().replace('标签: ', '');
                request.get($title.attr('href'))
                    .set('X-Real-IP', ipAddress2)
                    .set('X-Forwarded-For', ipAddress2)
                    .set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2414.0 Safari/537.36')
                    .set('Cookie', 'bid="MWRYk/7JW0w"; ll="118297"; dbcl2="65043156:cjbfVjCNqBU"; ap=1; ck="9ppw"; push_noty_num=0; push_doumail_num=2; __utmt_douban=1; __utma=30149280.597269190.1430889598.1433399318.1433468754.4; __utmb=30149280.5.10.1433468754; __utmc=30149280; __utmz=30149280.1430892868.2.2.utmcsr=tiye.me|utmccn=(referral)|utmcmd=referral|utmcct=/; __utmv=30149280.6504; __utmt=1; __utma=81379588.1087632970.1433399354.1433399354.1433468754.2; __utmb=81379588.5.10.1433468754; __utmc=81379588; __utmz=81379588.1433399354.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _pk_id.100001.3ac3=78a4e2cdd1723acd.1433399354.2.1433471658.1433399477.; _pk_ses.100001.3ac3=*')
                    .end(function(err, res2) {
                        var $$ = cheerio.load(res2.text);
                        var des = $$('#link-report').find('.intro').last().text();
                        data.push([index, userName, bookName, des, tags]);
                        cb(null);
                    });
            }, function(err, res) {
                callback(err, data);
            });
        });
}

var index = 1;
var tmp = require('./tmp.json');


if(tmp.index !== index){
	urls = urls.slice(tmp.index);
	result = tmp.data;
    index = tmp.index + 1;
}
async.eachSeries(urls, function(url, callback) {
    console.log(index + '------' + url);
    getBookInfo(url, index, function(err, data) {
        Array.prototype.push.apply(result, data);
        fs.writeFileSync('tmp.json', JSON.stringify({ index: index, data: result}));
        callback(null);
    });
    index++;
}, function(err, res) {
    fs.writeFileSync('book.xlsx', xlsx.build([{
        name: "sheet",
        data: result
    }]), 'binary');
    console.log('done');
});

