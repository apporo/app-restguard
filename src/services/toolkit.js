'use strict';

const lodash = require('lodash');
const moment = require('moment');
const jwt = require('jsonwebtoken');

const jwt_sign_options_names = [
  'algorithms', 'expiresIn', 'notBefore', 'audience', 'issuer', 'jwtid',
  'subject', 'noTimestamp', 'header', 'keyid', 'mutatePayload'
]

const jwt_verify_options_names = [
  'algorithms', 'audience', 'complete', 'issuer', 'ignoreExpiration', 'ignoreNotBefore',
  'subject', 'clockTolerance', 'maxAge', 'clockTimestamp', 'nonce'
]

function Service (params = {}) {
  const { sandboxConfig, loggingFactory } = params;
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  const config = lodash.pick(sandboxConfig, ['secretKey', 'expiresIn', 'expiredIn', 'ignoreExpiration']);
  config.secretKey = config.secretKey || 't0ps3cr3t'
  config.expiredIn = config.expiredIn || 60 * 60; // expires in 1 hour

  this.encode = function(data, opts) {
    opts = opts || {};
    //
    const now = moment();
    const secretKey = opts.secretKey || config.secretKey;
    const expiresIn = opts.expiresIn || config.expiredIn;
    const expiredTime = now.add(expiresIn, "seconds").toDate();
    //
    const accessObject = Object.assign({}, data, {
      expiredIn: expiresIn,
      expiredTime
    });
    //
    const auth = {
      access_token: jwt.sign(accessObject, secretKey, {
        expiresIn: expiresIn,
        ...lodash.pick(opts, jwt_sign_options_names)
      }),
      expires_in: expiresIn,
      expired_time: expiredTime
    };
    //
    return auth;
  }

  this.decode = function(token, opts) {
    return jwt.decode(token, lodash.pick(opts, ['json', 'complete']));
  }

  this.verify = function(token, opts) {
    opts = opts || {};
    //
    const secretKey = opts.secretKey || config.secretKey;
    //
    let ignoreExpiration = lodash.isBoolean(opts.ignoreExpiration) ? opts.ignoreExpiration :
        (lodash.isBoolean(config.ignoreExpiration) ? config.ignoreExpiration : undefined);
    //
    return jwt.verify(token, secretKey, {
      ...lodash.pick(opts, jwt_verify_options_names),
      ignoreExpiration
    });
  }
}

Service.referenceHash = {};

module.exports = Service;