# dinero-js
API client for [Dinero Regnskab](http://dinero.dk)

Requires `client_id` + `client_secret` from [api.dinero.dk](http://api.dinero.dk)

#### Example: Upload file and create purchase voucher

```javascript
var fs = require('fs')
var Dinero = require('dinero')
var moment = require('moment')

var client = new Dinero({
  clientId: '<your client id>',
  clientSecret: '<your client secret>'
})

var apiKey = '<your organiztion API key>'
var orgId = '<your organization id>'

client.auth(apiKey, apiKey).then(function(auth) {
  console.log('.. authenticated!')

  var createFile = client.files.create(orgId, {
    image: fs.createReadStream(__dirname + '/test1.pdf')
  }, { 
    multipart: true
  })

  createFile.then(function(body) {
    console.log('... file uploaded, id=', body.FileGuid)    
    return client.vouchers.purchase.create(orgId, {
      FileGuid: body.FileGuid,
      Notes: 'Uploaded from email',
      VoucherDate: moment(new Date()).format('YYYY-DD-MM')
    })
  }).then(function(body){
    console.log('.... voucher created, id=', body.VoucherGuid)
    console.log('DONE')
  }).catch(function(err) {
    console.log('error', err)
  })

})

```
