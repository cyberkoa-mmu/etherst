pragma solidity >=0.5 <0.9.0;

contract Console {
  event _Console(bool boolean);
  event _Console(int num);
  event _Console(uint num);
  event _Console(string str);
  event _Console(bytes32 b32);
  event _Console(address addr);

  function log(bool x) public {
    emit _Console(x);
  }

  function log(int x) public {
    emit _Console(x);
  }

  function log(uint x) public {
    emit _Console(x);
  }

  function log(string memory x) public {
    emit _Console(x);
  }

  function logByte(bytes32 x) public {
    emit _Console(x);
  }

  function log(address x) public {
    emit _Console(x);
  }
}