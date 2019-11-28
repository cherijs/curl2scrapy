var curlField = $('#curl');
var scrapyField = $('#scrapy');

function getMethod(str){
    let methodRegex = /-X (\w+)/;
    let methodMatch = str.match(methodRegex) ? str.match(methodRegex)[1] : null

    let postRegex = /\s(--data|--data-binary) \S/
    let postMatch = str.match(postRegex) ? 'POST' : null
    return methodMatch || postMatch || 'GET'
};

// Create header from string.
function extractHeader(str){
    return str.slice(4,-1).split(/: (.+)/)
}

// Create headers object and stringify it.
function getHeaders(str){
    let headersRegex = /-H '(.+?)'/g;
    return str.match(headersRegex).map(extractHeader).reduce(
        function(acc, v){acc[v[0]] = v[1]; return acc}, {});
};

// Extracting URL from curl data.
function getUrl(text){
    let urlRegex = /curl '(.+?)'/;
    return text.match(urlRegex)[1]
};

// Extracting cookies from headers
function getCookies(str){
    if (str == null){return null};
    return JSON.stringify(str.split(';').map(function(x){return x.split(/=(.+)/)}).reduce(function(acc, v){acc[v[0]] = v[1]; return acc}, {}), null, 4)
}

function getBody(str){
    let bodyRegex1 = /--data-binary '(.+?)'/
    let bodyRegex2 = /--data '(.+?)'/
    let match = str.match(bodyRegex1)  || str.match(bodyRegex2) 
    return match ? match[1] : null
}

// All together.
function curl2scrapy(){
    try {
        let curlText = curlField.val();
        let url = getUrl(curlText);
        let method = getMethod(curlText);
        let body = getBody(curlText);
        let headers = getHeaders(curlText);
        let cookieText = getCookies(headers.Cookie || headers.cookie || null);
        delete headers.Cookie;
        delete headers.cookie;
        let headersText = JSON.stringify(headers, null, 4);
        let result = `from scrapy import Request\n`
                    + `\n`
                    + `url = '[[url]]'\n`
                    + (headersText ? '\nheaders = [[headers]]\n' : '')
                    + (cookieText ? '\ncookies = [[cookies]]\n' : '')
                    + (body ? `\nbody = '[[body]]'\n` : '')

                    + `\nrequest = Request(\n`
                    + `    url=url,\n`
                    + `    method='[[method]]',\n`
                    + `    dont_filter=True,\n`
                    + (cookieText ? '    cookies=cookies,\n' : '')
                    + (headersText ? '    headers=headers,\n' : '')
                    + (body ? '    body=body,\n' : '')
                    + `)\n\n`
                    + `fetch(request)`

        result = result.replace('[[url]]', url)
        .replace('[[headers]]', headersText)
        .replace('[[cookies]]', cookieText)
        .replace('[[method]]', method)
        .replace('[[body]]', body)
        scrapyField.val(result);
        }
    catch {
        scrapyField.val('Something went wrong...');
    }
};

curlField.keydown(function (e) {

  if (e.ctrlKey && e.keyCode == 13) {
    // Ctrl-Enter pressed
    curl2scrapy();
  }
});