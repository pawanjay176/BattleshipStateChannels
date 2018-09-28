pragma solidity 0.4.24;

import "./Registry.sol";

contract MultiSig {

  Registry public registry;
  address public partyA;
  address public partyB;
  bytes32 public metachannel; // Counterfactual address of metachannel
  bytes32 public stateHash;

  bool public isOpen = false; // true when both parties have joined
  bool public isPending = false; // true when waiting for counterparty to join agreement

  constructor(bytes32 _metachannel, address _registry) public {
    require(_metachannel != 0x0, "No metachannel CTF address provided to Msig constructor");
    require(_registry != 0x0, "No CTF Registry address provided to Msig constructor");
    metachannel = _metachannel;
    registry = Registry(_registry);
  }
  function openAgreement(bytes _state, uint8 _v, bytes32 _r, bytes32 _s) 
  public 
  payable 
  {
    require(isOpen == false, "openAgreement already called, isOpen true");
    require(isPending == false, "openAgreement already called, isPending true");

    isPending = true;
    // check the account opening a channel signed the initial state
    address _initiator = _getSig(_state, _v, _r, _s);
    require(_initiator == msg.sender, "initiator didn't sign the state");

    partyA = _initiator;
    stateHash = keccak256(_state);
  }


  function joinAgreement(bytes _state, uint8 _v, bytes32 _r, bytes32 _s) 
  public 
  payable 
  {
    require(isOpen == false, "openAgreement not called");
    require(keccak256(_state) == stateHash, "joining party state different from initiator");

    isOpen = true;
    
    // check that the state is signed by the sender and sender is in the state
    address _joiningParty = _getSig(_state, _v, _r, _s);
    require(_joiningParty == msg.sender, "joining party didn't sign the state");
    partyB = _joiningParty;
  }
    
  function _getSig(bytes _d, uint8 _v, bytes32 _r, bytes32 _s) 
  internal 
  pure 
  returns(address) 
  {
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 h = keccak256(_d);

    bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, h));

    address a = ecrecover(prefixedHash, _v, _r, _s);

    return(a);
  }
}
