const Token = artifacts.require("./PKIToken.sol");
const Console = artifacts.require("Console");
const Ethrust = artifacts.require("Ethrust");

module.exports =  async function(_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(Console);
  _deployer.link(Console, Ethrust);
  let accounts = await web3.eth.getAccounts();
  //const token = await Token.at(tokenAddress);
  const token = await Token.deployed();

  // pass the accounts[0] as facet
  await _deployer.deploy(Ethrust, token.address, accounts[0]);

};
