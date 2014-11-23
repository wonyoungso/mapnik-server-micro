var _ = require('underscore');
var path = require('path');
var request = require('request');
// var source = require('source');
var style = require('./style');
// var task = require('../lib/task');
// var queue = require('queue-async');

var middleware = {};

middleware.loadStyle = function(req, res, next) {
    style(req.query.id, function(err, s) {
        if (err) return next(err);
        req.style = s;
        next();
    });
};


module.exports = middleware;
