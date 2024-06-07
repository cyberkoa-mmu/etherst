let token = artifacts.require("./PKIToken.sol");  

module.exports = function(_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(token);
};
