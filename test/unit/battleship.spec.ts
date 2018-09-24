import * as ethers from "ethers";

import * as Utils from "@counterfactual/test-utils";

import {Battleship} from '../../utils';
const BattleshipInterpreter = artifacts.require("BattleshipInterpreter");
const { sha3} = require('ethereumjs-util');
const web3 = (global as any).web3;
const { unlockedAccount } = Utils.setupTestEnv(web3);

contract("Battleship", (accounts: string[]) => {
  let game: ethers.Contract;
  let board1: Battleship;
  let board2: Battleship;
  let prevState: any;
  let prevMoveX: number;
  let prevMoveY: number;

  const stateEncoding = 
    "tuple(address[2] players, uint256 turnNum, uint256 winner, uint256[10][10] player1Board, uint256[10][10] player2Board, bytes32 player1MerkleRoot, bytes32 player2MerkleRoot, uint256 player1SunkCount,  uint256 player2SunkCount, uint256 prevMoveX, uint256 prevMoveY)"

  before(async () => {
    const contract = new ethers.Contract("", BattleshipInterpreter.abi, unlockedAccount);
    // Battleship.link("MerkleProof", MerkleProof.address);
    game = await contract.deploy(BattleshipInterpreter.binary);
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
  });

  describe("applyAction", () => {
    it("verify board formation", async () => {
      const root = board1.getMerkleRoot();
      const leaf = board1.getLeaf(0, 4)
      const proof = board1.getMerkleProof(0, 4);
      const ret = await game.functions.verify(proof, root, sha3(leaf));
      ret.should.be.eq(true);
    })

    it("play first move", async () => {
      const action = {
        actionType: 0,
        currMoveX: 0,
        currMoveY: 0,
        prevMoveHitOrMiss: 2, // Won't be used, still encoding
        prevMoveSalt: 0,
        prevMoveMerkleProof: new Array(0)
      }
      const ret = await game.functions.applyAction(prevState, action);

      let currState = ethers.utils.defaultAbiCoder.decode(
        [stateEncoding],
        ret
      )[0];

      currState.player2Board[0][0].should.be.bignumber.eq(1);
      prevState = currState;
      prevMoveX = action.currMoveX;
      prevMoveY = action.currMoveY;
    })

    it("play second move", async () => {
      const action = {
        actionType: 0,
        currMoveX: 0,
        currMoveY: 0,
        prevMoveHitOrMiss: 2,
        prevMoveSalt: board2.getSalts()[prevMoveX][prevMoveY],
        prevMoveMerkleProof: board2.getMerkleProof(prevMoveX, prevMoveY)
      }
      const ret = await game.functions.applyAction(prevState, action);

      const currState = ethers.utils.defaultAbiCoder.decode(
        [stateEncoding],
        ret
      )[0];
      
      currState.player1Board[0][0].should.be.bignumber.eq(1);
      currState.player2Board[0][0].should.be.bignumber.eq(2);
    })

    it("play winning move", async () => {

      prevState = {
        players: [Utils.ZERO_ADDRESS, Utils.ZERO_ADDRESS],
        turnNum: 2, //Ignoring check to avoid calculating turn number in which winning move would happen. Need to fix logic in interpreter
        winner: 0,
        player1Board: [[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],
        player2Board: [[0,0,0,0,0,0,0,0,0,0] 
        , [0,0,0,0,0,0,0,0,0,0] 
        , [0,0,0,0,0,0,0,0,0,0] 
        , [0,0,0,0,0,0,0,0,0,0]
        , [3,0,0,0,0,0,0,0,0,0] 
        , [3,3,0,0,0,0,0,0,0,0] 
        , [3,3,3,0,0,0,0,0,0,0]
        , [3,3,3,0,0,0,0,0,0,0]
        , [3,3,3,3,0,0,0,0,0,0]
        , [3,3,3,3,3,0,0,0,0,0]], //need to check sum(board[i][j])==17 in interpreter. 
        player1MerkleRoot: board2.getMerkleRoot(),
        player2MerkleRoot: board2.getMerkleRoot(),
        player1SunkCount: 0,
        player2SunkCount: 17,
        prevMoveX: 0,
        prevMoveY: 0
      }

      const action = {
        actionType: 1,
        currMoveX: 0, //doesn't matter
        currMoveY: 0, //doesn't matter
        prevMoveHitOrMiss: 2, //doesn't matter
        prevMoveSalt: board2.getSalts()[prevMoveX][prevMoveY], //doesn't matter
        prevMoveMerkleProof: board2.getMerkleProof(prevMoveX, prevMoveY) //doesn't matter
      }
      const ret = await game.functions.applyAction(prevState, action);

      const currState = ethers.utils.defaultAbiCoder.decode(
        [stateEncoding],
        ret
      )[0];
      
      currState.winner.should.be.bignumber.eq(1);
    })
  })
  

})