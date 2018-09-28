pragma solidity 0.4.24;
pragma experimental "ABIEncoderV2";

import "./StaticCall.sol";

contract Test {

  using StaticCall for address;
  
  struct App {
    address addr;
    bytes4 getTurnTaker;
  }

  function callSomeFunc(App app, bytes _state) public view returns(uint256) {
    return app.addr.staticcall_as_uint256(
      abi.encodePacked(app.getTurnTaker, _state)
    ); 
  }

  function hello() public pure returns(bytes) {
    return "Hello";
  }
}