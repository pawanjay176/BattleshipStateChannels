import * as ethers from "ethers";

import * as Utils from "@counterfactual/test-utils";

const Test = artifacts.require("Test");
const StaticCall = artifacts.require("StaticCall");
import {Battleship} from '../../utils';
const BattleshipInterpreter = artifacts.require("BattleshipInterpreter");
const { sha3, bufferToHex} = require('ethereumjs-util');
const web3 = (global as any).web3;
const { unlockedAccount } = Utils.setupTestEnv(web3);

Test.link("StaticCall", StaticCall.address);

contract("Test", (accounts: string[]) => {

  let test: ethers.Contract;
  let game: ethers.Contract;
  let board1: Battleship;
  let board2: Battleship;
  let prevState: any;
  let prevMoveX: number;
  let prevMoveY: number;

  before(async () => {
    const contract = new ethers.Contract("", Test.abi, unlockedAccount);
    test = await contract.deploy(Test.binary);
    const gameContract = new ethers.Contract("", BattleshipInterpreter.abi, unlockedAccount);
    game = await gameContract.deploy(BattleshipInterpreter.binary);
    board1 = new Battleship(
      [
        [1,1,1,1,1,0,0,0,0,0] 
      , [1,1,1,1,0,0,0,0,0,0] 
      , [1,1,1,0,0,0,0,0,0,0] 
      , [1,1,1,0,0,0,0,0,0,0] 
      , [1,1,0,0,0,0,0,0,0,0] 
      , [1,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0]
      ]
    );
    board2 = new Battleship(
      [ 
        [0,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0] 
      , [0,0,0,0,0,0,0,0,0,0]
      , [1,0,0,0,0,0,0,0,0,0] 
      , [1,1,0,0,0,0,0,0,0,0] 
      , [1,1,1,0,0,0,0,0,0,0]
      , [1,1,1,0,0,0,0,0,0,0]
      , [1,1,1,1,0,0,0,0,0,0]
      , [1,1,1,1,1,0,0,0,0,0]
      ]
    );
    //First state
    prevState = {
      players: [Utils.ZERO_ADDRESS, Utils.ZERO_ADDRESS],
      turnNum: 0,
      winner: 0,
      player1Board: [[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],
      player2Board: [[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],
      player1MerkleRoot: board2.getMerkleRoot(),
      player2MerkleRoot: board2.getMerkleRoot(),
      player1SunkCount: 0,
      player2SunkCount: 0,
      prevMoveX: 0,
      prevMoveY: 0
    }
  })
  const encode = (encoding: string, state: any) =>
    ethers.utils.defaultAbiCoder.encode([encoding], [state]);


  const appEncoding =
    "tuple(address addr, bytes4 getTurnTaker)";

    const stateEncoding = 
    "tuple(address[2] players, uint256 turnNum, uint256 winner, uint256[10][10] player1Board, uint256[10][10] player2Board, bytes32 player1MerkleRoot, bytes32 player2MerkleRoot, uint256 player1SunkCount,  uint256 player2SunkCount, uint256 prevMoveX, uint256 prevMoveY)"
  
  describe("test static call", () => {
    it("test something", async () => {
      let app = {
        addr: game.address,
        getTurnTaker: game.interface.functions.getTurnTaker.sighash
      }
      let state = encode(stateEncoding, prevState);
      const ret = await test.functions.callSomeFunc(app, state);
      console.log(ret);
    })
  })
})