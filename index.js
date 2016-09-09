'use strict'

var request = require('request')
var Promise = require('es6-promise').Promise

var actions = {
  'delete': 'del',
  'get': 'get',
  'post': 'create',
  'put': 'update'
}

var endpoints = [
  'post /:id/files',
  'post /:id/vouchers/purchase'
]

function Dinero (options) {
  this.clientId = options.clientId
  this.clientSecret = options.clientSecret
  this.accessToken = ''
  this.authEndpoint = 'https://authz.dinero.dk/dineroapi/oauth/token'

  this.settings = {
    url: 'https://api.dinero.dk/v1',
    params: {
      access_token: this.accessToken
    },
    headers: {}
  }

  if (typeof options === 'object') {
    extend(this.settings, options)
  }

  initialize.call(this)
}

Dinero.prototype = {

  auth: function (username, password) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: this.authEndpoint,
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + new Buffer(this.clientId + ':' + this.clientSecret).toString('base64')
        },
        form: {
          'grant_type': 'password',
          'scope': 'read write',
          'username': username,
          'password': password
        },
        json: true
      }

      request(options, function (err, response) {
        if (err || response.statusCode !== 200) {
          reject(err)
        } else {
          this.accessToken = response.body.access_token
          this.settings.headers = {
            'Authorization': 'Bearer ' + this.accessToken
          }
          resolve(response.body)
        }
      }.bind(this))
    }.bind(this))
  },

  request: function (endpoint, method, data, options) {
    return new Promise(function (resolve, reject) {
      var req = {
        url: this.settings.url + endpoint,
        method: method.toUpperCase(),
        headers: this.settings.headers,
        json: data
      }

      if (typeof options === 'object') {
        if (options.multipart) { // Used for file uploading
          req.json = true
          req.formData = data
        }
      }

      return request(req, function (err, response) {
        if (err || response.statusCode !== 200) {
          reject(err)
        } else {
          resolve(response.body)
        }
      })
    }.bind(this))
  }

}

function initialize () {
  function createNestedObject (base, names, value) {
    var lastName = arguments.length === 3 ? names.pop() : false
    for (var i = 0; i < names.length; i++) {
      if (names[i] !== '') {
        base = base[names[i]] = base[names[i]] || {}
      }
    }
    if (lastName) {
      base = base[lastName] = value
    }
    return base
  }

  function addMethod (route) {
    var parts = route.split(' ')
    var method = parts[0]
    var path = parts[1]
    var pathArr = parts[1].replace('/:id', '').split('/')

    pathArr.push(actions[method])

    var fn = function () {
      var args = Array.prototype.slice.call(arguments)
      var endpoint = path
      if (path.indexOf(':id') > -1) {
        endpoint = path.replace(':id', args[0])
        args.shift()
      }
      return this.request(endpoint, method, args[0], args[1])
    }.bind(this)

    createNestedObject(this, pathArr, fn)
  }

  for (var i = 0; i < endpoints.length; i += 1) {
    addMethod.call(this, endpoints[i])
  }
}

function extend (target, obj) {
  for (var key in obj) {
    target[key] = obj[key]
  }
}

module.exports = Dinero
