'use strict';

const assetTransfer = require('./lib/BankAccount');

module.exports.AssetTransfer = assetTransfer;
module.exports.contracts = [assetTransfer];