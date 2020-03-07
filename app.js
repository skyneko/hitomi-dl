const request = require("request")
const fs = require("fs")
const cliProgress = require('cli-progress');
 
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

function subdomain_from_galleryid(g, number_of_frontends) {

    var o = g % number_of_frontends;

    return String.fromCharCode(97 + o);
}

function subdomain_from_url(url, base) {
    var retval = 'a';
    if (base) {
        retval = base;
    }

    var number_of_frontends = 3;
    var b = 16;

    var r = /\/[0-9a-f]\/([0-9a-f]{2})\//;
    var m = r.exec(url);
    if (!m) {
        return retval;
    }

    var g = parseInt(m[1], b);
    if (!isNaN(g)) {
        if (g < 0x30) {
            number_of_frontends = 2;
        }
        if (g < 0x09) {
            g = 1;
        }
        retval = subdomain_from_galleryid(g, number_of_frontends) + retval;
    }

    return retval;
}

function getSubdomain(url) {
    return subdomain_from_url(url)
}

function getGalleryInfo(gallery_id) {

    return new Promise((resolve, reject) => {

        request({
            uri: "https://ltn.hitomi.la/galleries/"+gallery_id+".js",
            method: "GET"
        }, (err, res, body) => {

            let json = JSON.parse(body.slice(body.indexOf("{"), body.length))
            resolve(json)
        })
    })
}

function full_path_from_hash(hash) {

    if (hash.length < 3) {
        return hash;
    }
    return hash.replace(/^.*(..)(.)$/, '$2/$1/' + hash);
}


function url_from_hash(galleryid, image, dir, ext) {

    ext = ext || dir || image.name.split('.').pop();
    dir = dir || 'images';

    return 'https://a.hitomi.la/' + dir + '/' + full_path_from_hash(image.hash) + '.' + ext;
}

function url_from_url(url, base) {
    return url.replace(/\/\/..?\.hitomi\.la\//, '//' + getSubdomain(url, base) + '.hitomi.la/');
}


function arrNummberToSplit(n, s) {

    let m = [];

    for (i = 0; i < n / s; ++i) {
        m.push(s * i)
    }

    m.push(n)

    return m
}

function getImageUrl(img_data_arr, gallery_id) {

    if (typeof img_data_arr === "object" && img_data_arr[0] !== undefined) {
        return img_data_arr.map(img_data => {

            data = {
                "galleryid": gallery_id,
                "image": img_data,
                "dir": "webp"
            }
            return url_from_url(url_from_hash(data.galleryid, data.image, data.dir))
        })
    }
}

const globalHeaders = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://hitomi.la',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'TE': 'Trailers'
}

function checkFileExt(url) {
    return new Promise((resolve) => {

        request({
            uri: url,
            headers: globalHeaders,
            method: "GET"
        }, (err, res, body) => {

            resolve((res.statusCode === 200) ? ".webp" : ".jpg");
        })
    })
}

function downloadImage(url, filename, gallery_id, gallery_name) {

    let dir_path = "./image/" + gallery_name + "/"

    if (!fs.existsSync(dir_path)) fs.mkdirSync(dir_path)

    return new Promise((resolve) => {
        request({
            uri: url,
            headers: globalHeaders,
            method: "GET"
        })

        .pipe(fs.createWriteStream( dir_path + filename))
        
        .on("close", resolve)
    })
}

function multiDownload(arr_url, gallery_id, gallery_name, file_ext, thread) {

    if (typeof arr_url === "object" && arr_url[0] !== undefined) {

        return new Promise((resolve) => {

            let arrNumThread = arrNummberToSplit(arr_url.length, thread);

            //console.log(arrNumThread);
    
            (function download (n = 0) {
    
                let promiseArr = []
    
                for (i=arrNumThread[n]; i < arrNumThread[n+1]; ++i) {
    
                    //console.log(n)
    
                    promiseArr.push(new Promise ((resolve) => {
                        //console.log(i)
                        downloadImage(arr_url[i], (i+1) + file_ext, gallery_id, gallery_name)
                            .then(() => {
                                
                                resolve()
                                bar1.increment(1); 
                            })
                    }))
    
                }
    
                Promise.all(promiseArr)
                        .then(() => {
                            
                            if (n < arrNumThread.length) {
                                    
                                download(n+1)   
                            } else {

                                resolve()
                                bar1.stop();
                            }
                        })
                
            })() 
        })

    } else return console.log("data not is array")
}

module.exports = function download(url) {

    let s = url.split("/")[4]
    let id = s.slice(s.lastIndexOf("-")+1, s.length-5)

    // console.log(id)

    getGalleryInfo(id).then(result => {

        let img_url = getImageUrl(result.files, result.id)
        //console.log(img_url.length + " pictures.")
        bar1.start(img_url.length, 0);
    
        //console.log(result)
    
        checkFileExt(img_url[0]).then(file_ext => {
            
            if (file_ext === ".jpg") {
                img_url = img_url.map(url => {
    
                    url = url.replace(".webp", ".jpg")
                    url = url.replace("webp", "images")
    
                    return url
                })
            }
    
            multiDownload(img_url, result.id, result.title, file_ext, 5).then(() => { console.log("done.") })
        })
    
    })
    
}
