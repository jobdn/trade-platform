//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TradePlatform is ReentrancyGuard {
    uint256 public INITIAL_TOKEN_AMOUNT;
    uint256 public roundTime;
    address public token;

    uint256 public tradeStock;
    uint256 public startsAt;
    uint256 public endsAt;
    uint256 public tokenPrice;
    uint256 public tokens;
    RoundStatus public roundStatus;

    mapping(address => uint256) public _balances;
    mapping(address => User) public users;
    enum RoundStatus {
        SALE,
        TRADE
    }

    struct User {
        uint256 amountOfACDM;
        address referer;
        bool isReferer;
        bool isExists;
    }

    constructor(address _token, uint256 _roundTime) {
        token = _token;
        roundTime = _roundTime;
        roundStatus = RoundStatus.TRADE;
        INITIAL_TOKEN_AMOUNT = 10**5;
    }

    /**@notice User can register using this function
     * @dev It is needed
     * @param _referer Address of referer
     */
    function register(address _referer) public {
        require(!users[msg.sender].isExists, "Plafrotm: existent user");
        require(users[_referer].isExists, "Platform: not existent referer");
        users[msg.sender] = User({
            amountOfACDM: 0,
            referer: _referer,
            isReferer: false,
            isExists: true
        });
        if (_referer != address(0)) {
            users[_referer].isReferer = true;
        }
    }

    /**
        @notice Starts Sale round
     */
    function startSaleRound() public {
        require(
            roundStatus == RoundStatus.TRADE,
            "Platform: trade round is not over"
        );
        // проверка на вызов раундов через время roundTime
        require(
            block.timestamp > endsAt,
            "Platform: time of last round is not over"
        );

        if (tokenPrice == 0) {
            // Sale round starts for the first time
            tokenPrice = 1 ether / INITIAL_TOKEN_AMOUNT;
            tokens = INITIAL_TOKEN_AMOUNT;
        } else {
            tokenPrice = (tokenPrice * 103) / 100 + 4 * 10**12;
            // TODO: if tradeStock is equal to zero call the startTradeRound
            tokens = tradeStock / tokenPrice;
        }
        startsAt = block.timestamp;
        endsAt = startsAt + roundTime;
        roundStatus = RoundStatus.SALE;
    }

    /**
        @notice Starts Trade round
     */
    function startTradeRound() public {
        require(
            roundStatus == RoundStatus.SALE,
            "Platform: sale round is not over"
        );
        require(
            block.timestamp > endsAt || tokens == 0,
            "Platform: time of last round is not over"
        );
        //TODO: If some tokens remain, then burn them
        startsAt = block.timestamp;
        endsAt = startsAt + roundTime;
        roundStatus = RoundStatus.TRADE;
    }

    /**
        @notice User can buy ACDM tokens for ETH
     */
    function buyACDM() public payable nonReentrant {
        require(msg.value > 0, "Platfrom: zero msg.value");
        require(roundStatus == RoundStatus.SALE, "Platform: only sale round");
        // TODO: if all token are bought call startTradeRound
    }
}
