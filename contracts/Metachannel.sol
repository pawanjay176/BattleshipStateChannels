pragma solidity 0.4.24;
pragma experimental "ABIEncoderV2";
import "./Registry.sol";
import "./Signatures.sol";

contract Metachannel {
  using Signatures for bytes;
  
  struct MetaState {
    uint balanceA;
    uint balanceB;
    uint stateNonce;
  }

  struct App {
    address addr;
    bytes4 applyAction;
    bytes4 resolve;
    bytes4 getTurnTaker;
    bytes4 isStateTerminal;
  }

  struct SubState {
    uint channelId;
    uint nonce;
    uint timeout;
    uint balanceA;
    uint balanceB;
    bytes32 ctfAddress;
    bytes appState;
  }

  address[] public owners;
  uint public timeout; //timeout for the adjudica
  Registry public registry;
  MetaState state;

  mapping (uint => SubState) subchannels;

  constructor(address _partyA, address _partyB, address _registry, uint _timeout) public {
    require(_partyA != 0x0 && _partyB != 0x0 && _registry != 0x0, "Invalid address");
    owners.push(_partyA);
    owners.push(_partyB);
    timeout = _timeout;
  }

  function setMetachannelState(uint _balanceA, uint _balanceB, uint _stateNonce, bytes signatures) public {
    require(_stateNonce >= state.stateNonce, "Outdated state");
    bytes32 metaStateHash = keccak256(abi.encode(_balanceA, _balanceB, _stateNonce));
    require(signatures.verifySignatures(metaStateHash, owners), "Signature verification failed");
    state.balanceA = _balanceA;
    state.balanceB = _balanceB;
    state.stateNonce = _stateNonce;
  }

  function startSubchannelDispute(MetaState _state, SubState _substate, bytes metaSignatures, bytes subSignatures) public {
    require(msg.sender == owners[0] || msg.sender == owners[1], "Dispute should be started by one of the parties");
    require(_state.stateNonce >= state.stateNonce && subchannels[_substate.channelId].nonce >= _substate.nonce, "Outdated nonce");

    require(metaSignatures.verifySignatures(keccak256(abi.encode(_state)), owners), "Signature verification on metachannel state failed");
    require(subSignatures.verifySignatures(keccak256(abi.encode(_substate)), owners), "Signature verification on subchannel state failed");
  }
}