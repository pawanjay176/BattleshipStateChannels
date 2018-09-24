pragma solidity 0.4.24;
pragma experimental "ABIEncoderV2";

import "openzeppelin-solidity/contracts/MerkleProof.sol";

contract BattleshipInterpreter {
  enum ActionType {
    PLAY,
    PLAY_AND_WIN
  }

  enum MoveType {
    MISS_SQUARE,
    HIT_SQUARE
  }

  struct Coord {
    uint256 x;
    uint256 y;
  }

  uint256 constant GAME_IN_PROGRESS = 0;
  
  // Empty square means not revealed yet
  uint256 constant HIDDEN_SQUARE = 0;
  uint256 constant SELECTED_SQUARE = 1; //Intermediate state between HIDDEN and HIT/MISS
  uint256 constant MISS_SQUARE = 2;
  uint256 constant HIT_SQUARE = 3;
  uint256 constant TOTAL_SUNK_COUNT = 17; //Does not ensure correct placing of ships in any way

  struct AppState {
    address[2] players;
    uint256 turnNum;
    uint256 winner;
    uint256[100][100] player1Board;
    uint256[100][100] player2Board;
    bytes32 player1MerkleRoot;
    bytes32 player2MerkleRoot;
    uint256 player1SunkCount; //How many squares were sunk. Total 17 squares sunk means all ships are sunk. ** Assuming placed correctly **
    uint256 player2SunkCount;
    uint256 prevMoveX;
    uint256 prevMoveY;
  }

  struct Action {
    /* Current move entries */
    ActionType actionType;
    uint256 currMoveX;
    uint256 currMoveY;
    /* Prev move entries */
    uint256 prevMoveHitOrMiss; // MISS_SQUARE or HIT_SQUARE
    uint256 prevMoveSalt;
    //keeping byte array size as 7 since the number of leaves would be 100. So closest power of 2 is 2^7 = 128. TODO: Check if dynamic array works!
    bytes32[] prevMoveMerkleProof;
  }

  function verify(
    bytes32[] proof,
    bytes32 root,
    bytes32 leaf
  )
    public
    pure
    returns (bool)
  {
    return MerkleProof.verifyProof(proof, root, leaf);
  }

  function isStateTerminal(AppState state)
  public
  pure
  returns (bool)
  {
    return state.winner != GAME_IN_PROGRESS;
  }

  function getTurnTaker(AppState state)
    public
    pure
    returns (uint256)
  {
    return state.turnNum % 2;
  }

  function applyAction(AppState state, Action action)
  public
  pure
  returns (bytes)
  {
    AppState memory nextState;
    if(action.actionType == ActionType.PLAY) {
      nextState = playMove(state, action);
    }
    else if(action.actionType == ActionType.PLAY_AND_WIN) {
      assertWin(state, state.turnNum % 2);
      // Also need to assert that the winner placed the ships correctly.
      // Option1: Give a merkle proof for every unopened square.
      // Option2: ZKP for proving each player correctly generated board state in the beginning. https://devpost.com/software/gameofsnarks_contracts
      nextState.winner = (nextState.turnNum % 2) + 1; //1 is player1 won, 2 is player2 won. * Turn number is incremented at the end of this function*
    }
    nextState.turnNum += 1;
    return abi.encode(nextState);
  }

  // function resolve(AppState state, Transfer.Terms terms)
  // public
  // pure
  // returns (Transfer.Details)
  // {
  //   require(state.winner != 0, "Game still in progress");
  //   uint256[] memory amounts = new uint256[](2);
  //   address[] memory to = new address[](2);
  //   bytes memory data; // = 0

  //   if (state.winner == 3) {
  //     amounts[0] = terms.limit / 2;
  //     amounts[1] = terms.limit / 2;

  //     to[0] = state.players[0];
  //     to[1] = state.players[1];

  //     return Transfer.Details(
  //       terms.assetType,
  //       terms.token,
  //       to,
  //       amounts,
  //       data
  //     );

  //   } else {
  //     address loser = state.players[state.winner - 1];
  //     address winner = state.players[2 - state.winner];

  //     amounts[0] = terms.limit;
  //     amounts[1] = 0;

  //     to[0] = winner;
  //     to[1] = loser;

  //     return Transfer.Details(
  //       terms.assetType,
  //       terms.token,
  //       to,
  //       amounts,
  //       data
  //     );
  //   }
  // }

  function playMove(AppState state, Action action)
  public
  pure
  returns (AppState)
  {
    if(state.turnNum == 0) {
      return playFirstMove(state, action);
  }
    uint256 currPlayer = state.turnNum % 2;
    uint256 currMoveX = action.currMoveX;
    uint256 currMoveY = action.currMoveY;
    uint256 prevMoveX = state.prevMoveX;
    uint256 prevMoveY = state.prevMoveY;

    require(action.prevMoveHitOrMiss == MISS_SQUARE || action.prevMoveHitOrMiss == HIT_SQUARE, "Invalid value for prevMoveHitOrMiss");

    require(currMoveX >= 0 && currMoveY >= 0 && currMoveX <= 100 && currMoveY <= 100, "Invalid move");

    bytes32 leaf = keccak256(abi.encode(action.prevMoveHitOrMiss, prevMoveX, prevMoveY, action.prevMoveSalt));

    if (currPlayer == 0) {
      // Verify that the move hasn't already been played
      require(state.player2Board[currMoveX][currMoveY] == 0, "Square has already been revealed");
      // Verify previous move.
      // Maybe take drastic measures such as ending the game to deinsentivise bad behaviour
      require(MerkleProof.verifyProof(action.prevMoveMerkleProof, state.player1MerkleRoot, leaf) == true, "Wrong reporting of previous move");
      // Set the board according to currMove and prevMove
      state.player1Board[prevMoveX][prevMoveY] = action.prevMoveHitOrMiss;
      state.player2Board[currMoveX][currMoveY] = 1;
      if(action.prevMoveHitOrMiss == HIT_SQUARE)
        state.player2SunkCount += 1;
    }
    else if (currPlayer == 1) {
      // Verify that the move hasn't already been played
      require(state.player1Board[currMoveX][currMoveY] == 0, "Square has already been revealed");
      // Verify previous move.
      // Maybe take drastic measures such as ending the game to deinsentivise bad behaviour
      require(MerkleProof.verifyProof(action.prevMoveMerkleProof, state.player2MerkleRoot, leaf) == true, "Wrong reporting of previous move");
      // Set the board according to currMove and prevMove
      state.player2Board[prevMoveX][prevMoveY] = action.prevMoveHitOrMiss;
      state.player1Board[currMoveX][currMoveY] = 1;
      if(action.prevMoveHitOrMiss == HIT_SQUARE)
        state.player1SunkCount += 1;
    }
    state.prevMoveX = action.currMoveX;
    state.prevMoveY = action.currMoveY;
    return state;
  }


  function assertWin(AppState state, uint256 player) 
  internal
  pure
  {
    if(player == 0) {
      require(state.player2SunkCount == 17, "Not a winning position");
    }
    else if(player == 1) {
      require(state.player1SunkCount == 17, "Not a winning position");
    }
  }

  function playFirstMove(AppState state, Action action)
  internal
  pure
  returns (AppState)
  {
    uint256 currMoveX = action.currMoveX;
    uint256 currMoveY = action.currMoveY;
    state.player2Board[currMoveX][currMoveY] = 1;
    return state;
  }
}