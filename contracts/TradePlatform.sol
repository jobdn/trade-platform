//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./test/TradeToken.sol";

contract TradePlatform is ReentrancyGuard {
    using SafeERC20 for IERC20;
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
        uint256 amountOfTokens;
        address referer;
        bool isReferer;
    }

    error NotExpiredTimeError(string errorMsg);

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
        require(msg.sender != _referer, "Plafrotm: invalid referer");

        users[msg.sender].isReferer = true;

        if (_referer != address(0)) {
            require(
                users[_referer].isReferer,
                "Platform: not existent referer"
            );
            users[msg.sender].referer = _referer;
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
        require(
            block.timestamp > endsAt,
            "Platform: time of the last round is not over"
        );

        if (tokenPrice == 0) {
            // Sale round starts for the first time
            tokenPrice = 1 ether / INITIAL_TOKEN_AMOUNT;
            tokens = INITIAL_TOKEN_AMOUNT;
        } else {
            tokenPrice = (tokenPrice * 103) / 100 + 4 * 10**12;
            // TODO: tradeStock is equal to zero then call the startTradeRound
            tokens = tradeStock / tokenPrice;
        }
        TradeToken(token).mint(address(this), tokens);
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
        if (block.timestamp <= endsAt && tokens != 0) {
            revert NotExpiredTimeError(
                "Platform: time of the last round is not over"
            );
        }

        //TODO: If some tokens remain, then burn them
        startsAt = block.timestamp;
        endsAt = startsAt + roundTime;
        roundStatus = RoundStatus.TRADE;
    }

    /**
        @notice User can buy ACDM tokens for ETH
     */
    function buyToken(uint256 _amount) public payable nonReentrant {
        require(
            _amount <= tokens,
            "Platform: not enough tokens on the plaftorm"
        );
        require(
            msg.value / tokenPrice >= _amount,
            "Platform: not enough msg.value"
        );
        // TODO: Do i need this checking?
        require(roundStatus == RoundStatus.SALE, "Platform: only sale round");
        if (msg.value / tokenPrice > _amount) {
            msg.sender.call{value: msg.value - tokenPrice * _amount}("");
        }
        // TODO: I need to create a referal programm
        IERC20(token).safeTransfer(msg.sender, _amount);
        users[msg.sender].amountOfTokens += _amount;
        tokens -= _amount;
        if (tokens == 0) {
            address(this).call(abi.encodeWithSignature("startTradeRound()"));
        }
    }
}