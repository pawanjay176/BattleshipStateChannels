var utils = require('ethers').utils;
import {MerkleTree} from 'openzeppelin-solidity/test/helpers/merkleTree.js'

export class Battleship {
  private board: number[][];
  private salts: number[][];
  private merkleTree: MerkleTree;

  constructor(playerBoard : number[][]) {
    this.board = playerBoard;
    this.salts = this.board.map(arr => this.generateSalt(arr.length));
    this.generateMerkleTree();
  }

  private generateMerkleTree() {
    var elems = new Array(100);
    for(var i=0;i<10;i++) {
      for(var j=0;j<10;j++) {
        var temp = utils.solidityKeccak256(['uint256', 'uint256', 'uint256', 'uint256'], [this.board[i][j], i, j, this.salts[i][j]]);
        elems.push(temp);
      }
    }
    this.merkleTree = new MerkleTree(elems);
  }

  public getMerkleRoot(){
    return this.merkleTree.getHexRoot();
  }
  private generateSalt(len: number): number[] {
    return Array.from({length: len}, () => Math.floor(Math.random() * 1000000));
  }

  public getLeaf(x: number, y: number) {
    return utils.solidityKeccak256(['uint256', 'uint256', 'uint256', 'uint256'], [this.board[x][y], x, y, this.salts[x][y]]);
  }

  public getMerkleProof(x: number, y: number) {
    return this.merkleTree.getHexProof(
      utils.solidityKeccak256(['uint256', 'uint256', 'uint256', 'uint256'], [this.board[x][y], x, y, this.salts[x][y]])
    );
  }

  public getBoard() {
    return this.board;
  }
  public getSalts() {
    return this.salts;
  }

}