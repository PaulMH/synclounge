// ABOUT
// Runs the Plex Together Web App - handles serving the static web content and link shortening services
// Defaults to 8088


// USER CONFIG
var PORT = 8088
var accessIp = 'http://10.0.0.38:8088/pt' // EG 'http://95.231.444.12:8088/pt' or 'http://example.com/pt' 





// END USER CONFIG
var express = require('express');
var path = require('path');
var cors = require('cors')

var root = express()
root.use(cors())

var combined = express()

var webapp = express();
var ptserver = express();

// Setup our web app
webapp.use('/',express.static(path.join(__dirname, 'dist')));


// Merge everything together

combined.use('/web',webapp)
combined.get('/invite/:id',function(req,res){
    let shortObj = shortenedLinks[req.params.id]
    if (!shortObj){
        return res.send('Whoops, looks like youve made a wrong turn..')        
    }
    console.log('Redirecting an invite link')
    return res.redirect(shortObj.fullUrl)
})
combined.get('*',function(req,res){
    return res.redirect('/pt/web/')
})


root.use('/pt',combined)
root.get('*',function(req,res){
    return res.redirect('/pt/web')
})





var rootserver = require('http').createServer(root);

var webapp_io = require('socket.io')(rootserver,{path: '/pt/web/socket.io'});

var shortenedLinks = {}

function getUniqueId(){    
    while (true){
        let testId = (0|Math.random()*9e6).toString(36)
        if (!shortenedLinks[testId]){    // Check if we already have a shortURL using that id
            return testId
        }
    }

}

function shortenObj(data){
    let returnable = {}
    returnable.urlOrigin = accessIp
    returnable.owner = data.owner

    returnable.ptserver = data.ptserver
    returnable.ptroom = data.ptroom
    returnable.ptpassword = data.ptpassword

    returnable.starttime = (new Date).getTime()
    returnable.id = getUniqueId()
    returnable.shortUrl = accessIp + '/invite/' + returnable.id

    let params = {
        ptserver: data.ptserver,
        ptroom: data.ptroom,
        owner: data.owner
    }
    if (data.ptpassword){
        params.ptpassword = data.ptpassword
    }
    let query = ''
    for (let key in params) {
        query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
    }
    returnable.fullUrl = accessIp + '/web/#/?' + query

    shortenedLinks[returnable.id] = returnable
    return returnable.shortUrl
}

webapp_io.on('connection', function(socket){
    console.log('Someone connected to the webapp socket')
    socket.on('shorten',function(data){
        console.log('Creating a shortened link')
        socket.emit('shorten-result',shortenObj(data))
    })
})



rootserver.listen(PORT);
console.log('PlexTogether WebApp successfully started on port ' + PORT)






