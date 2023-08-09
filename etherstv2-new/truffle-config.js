require('babel-register');
require('babel-polyfill');
var HDWalletProvider = require("@truffle/hdwallet-provider");
//const MNEMONIC = '0x574D124F4E95ab9100BA914d621B3064420c6526';
const MNEMONIC = 'boring dream advice become basic jewel monitor phone dog anchor clown rich';


// const FROM_ADDRESS = '0x5cb1E26E09cC99A2f143124ec97113B9b1671ee4';
const FROM_ADDRESS = '0xD232371Aa9EC715F89C6Cc1de96f9331Ccc956C6';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      websockets: true
    },
   /*
    ropsten: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/67a07e973fa84cc783fd458963a8dffd", 1)
      },
      network_id: 3,
      networkCheckTimeout: 1000000,
      from: FROM_ADDRESS,
      gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
    } */
  }
};
