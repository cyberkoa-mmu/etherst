/* pragma solidity ^0.4.19; */
pragma solidity >=0.4.21 <0.9.0;

//import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
* @title PKIToken is a basic ERC20 Token to be used in smart-contract based PKI
*/
contract PKIToken is ERC20, ERC20Detailed, Ownable {

  uint256 public totalSupplyCount;

  /**
 * @dev assign totalSupply to account creating this contract */
 constructor() public
    ERC20Detailed("PKIToken", "PKI", 5) {
    totalSupplyCount = 100000000000;

  // Ganache does not recognise "this" as an account, we let the token supply to first account (accounts[0])
  //_mint(address(this), totalSupplyCount);

  _mint(msg.sender, totalSupplyCount);
 }
}
