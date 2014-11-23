var path = require('path');
var _ = require('underscore');
var qs = require('querystring');
var fs = require('fs');
var url = require('url');
var style = require('./style');
var middleware = require('./middleware');
var cors = require('cors');
var stats = require('./stats');
var getport = require('getport');
var express = require('express');
var app = express();
var saferstringify = require('safer-stringify');
var gazetteer = require('gazetteer');
var carto = require('carto');
var nocache = Math.random().toString(36).substr(-8);
var mapnik = require('mapnik');
var source = require('./source');

app.use(express.bodyParser());
app.use(app.router);

middleware.style = [
    middleware.loadStyle
];


app.get('/style/:z(\\d+)/:x(\\d+)/:y(\\d+).:format([\\w\\.]+)', middleware.style, cors(), tile);

app.get('/style/:z(\\d+)/:x(\\d+)/:y(\\d+):scale(@\\d+x).:format([\\w\\.]+)', middleware.style, cors(), tile);


function tile(req, res, next) {
    var z = req.params.z | 0;
    var x = req.params.x | 0;
    var y = req.params.y | 0;
    var scale = (req.params.scale) ? req.params.scale[1] | 0 : undefined;
    // limits scale to 4x (1024 x 1024 tiles or 288dpi) for now
    scale = scale > 4 ? 4 : scale;

    var id = req.source ? req.source.data.id : req.style.data.id;
    var source = req.params.format === 'vector.pbf'
        ? req.style._backend._source
        : req.style;
    var done = function(err, data, headers) {
        if (err && err.message === 'Tilesource not loaded') {
            return res.redirect(req.path);
        } else if (err) {
            // Set errors cookie for this style.
            style.error(id, err);
            res.cookie('errors', _(style.error(id)).join('|'));
            return next(err);
        }

        // Set drawtime/srcbytes cookies.
        stats.set(source, 'drawtime', z, data._drawtime);
        stats.set(source, 'srcbytes', z, data._srcbytes);
        res.cookie('drawtime', stats.cookie(source, 'drawtime'));
        res.cookie('srcbytes', stats.cookie(source, 'srcbytes'));

        // Clear out tile errors.
        res.cookie('errors', '');

        // If debug flag is set, reduce json data.
        if (done.format === 'json' && 'debug' in req.query) {
            data = _(data).reduce(function(memo, layer) {
                memo[layer.name] = {
                    features: layer.features.length,
                    jsonsize: JSON.stringify(layer).length
                };
                return memo;
            }, {});
        }

        headers['cache-control'] = 'max-age=3600';
        if (req.params.format === 'vector.pbf') {
            headers['content-encoding'] = 'deflate';
        }
        res.set(headers);
        return res.send(data);
    };
    done.scale = scale;
    if (req.params.format !== 'png') done.format = req.params.format;
    source.getTile(z,x,y, done);
}


module.exports = app;

