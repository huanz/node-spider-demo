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
        .set('Cookie', '')
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
                    .set('Cookie', '')
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

