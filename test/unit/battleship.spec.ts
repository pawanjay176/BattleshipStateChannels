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
  const stateEncoding = 
    "tuple(address[2] players, uint256 turnNum, uint256 winner, uint256[100][100] player1Board, uint256[100][100] player2Board, bytes32 player1MerkleRoot, bytes32 player2MerkleRoot; uint256 player1SunkCount,  uint256 player2SunkCount, uint256 prevMoveX, uint256 prevMoveY)"

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
  });

  describe("applyAction", () => {
    it("verify board formation", async () => {
      const root = board1.getMerkleRoot();
      const leaf = board1.getLeaf(0, 4)
      const proof = board1.getMerkleProof(0, 4);
      const ret = await game.functions.verify(proof, root, sha3(leaf));
      ret.should.be.bignumber.eq(1);
      ret.should.be.eq(true);
    })
  })

})