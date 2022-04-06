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
    uint256 public tradeStock;
    uint256 public roundStartTime;
    uint256 public roundEndTime;
    uint256 public tokenPrice;
    uint256 public tokens;
    address public token;
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

    struct Order {
        uint256 tokensAmount;
        uint256 price;
        address seller;
        bool closed;
    }

    Order[] public orders;

    error NotExpiredTimeError(string errorMsg);

    constructor(address _token, uint256 _roundTime) {
        require(_token != address(0), "Platform: invalid token");
        require(_roundTime != 0, "Platform: invalid round time");
        token = _token;
        roundTime = _roundTime;
        roundStatus = RoundStatus.TRADE;
        INITIAL_TOKEN_AMOUNT = 10**5;
    }

    /**@notice User needs to call this function to become referer
     * @param _referer Address of referer
     */
    function register(address _referer) public {
        // TODO: if user1 is ferefer of user2 and user2 is referer user1
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
            block.timestamp > roundEndTime,
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
        roundStartTime = block.timestamp;
        roundEndTime = roundStartTime + roundTime;
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
        // TODO: Can I implement this using require?
        if (block.timestamp <= roundEndTime && tokens != 0) {
            revert NotExpiredTimeError(
                "Platform: time of the last round is not over"
            );
        }

        TradeToken(token).burn(address(this), tokens);
        roundStartTime = block.timestamp;
        roundEndTime = roundStartTime + roundTime;
        roundStatus = RoundStatus.TRADE;
    }

    /**
        @notice User can buy ACDM tokens for ETH
        @dev If user sends tokens more than necessary, then the excess is sent back 
        @param _amount Amount of purchased tokens
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
        require(roundStatus == RoundStatus.SALE, "Platform: only sale round");

        uint256 refund = msg.value - tokenPrice * _amount;
        if (refund > 0) {
            msg.sender.call{value: refund}("You sent more than need ETH");
        }

        address firstReferer = users[msg.sender].referer;
        if (firstReferer != address(0)) {
            address secondReferer = users[firstReferer].referer;
            if (secondReferer != address(0)) {
                uint256 SECOND_REFERER_FEE = 3;
                secondReferer.call{
                    value: (_amount * tokenPrice * SECOND_REFERER_FEE) / 100
                }("Percentage of second referer");
            }
            uint256 FIRST_REFERER_FEE = 5;
            firstReferer.call{
                value: (_amount * tokenPrice * FIRST_REFERER_FEE) / 100
            }("Percentage of first referer");
        }
        IERC20(token).safeTransfer(msg.sender, _amount);
        users[msg.sender].amountOfTokens += _amount;
        tokens -= _amount;
        if (tokens == 0) {
            (bool success, ) = address(this).call(
                abi.encodeWithSignature("startTradeRound()")
            );
            require(success, "Platform: call fail");
        }
    }

    /**  @notice Adds orders
     * @dev To add order user needs to buy tokens in sale round
     * @param _amount Amount of tokens for trade rount
     * @param  _price Price for amount of tokens
     */
    function addOrder(uint256 _amount, uint256 _price) public {
        require(
            _amount != 0 && users[msg.sender].amountOfTokens >= _amount,
            "Platform: zero funds"
        );
        require(
            roundStatus == RoundStatus.TRADE,
            "Platform: only trade round function"
        );
        orders.push(
            Order({
                tokensAmount: _amount,
                price: _price,
                seller: msg.sender,
                closed: false
            })
        );
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    }

    function redeemOrder(uint256 _id, uint256 _amount)
        public
        payable
        nonReentrant
    {
        require(_id < orders.length, "Platform: invalid order");
        require(!orders[_id].closed, "Platform: closed order");
        require(
            _amount <= orders[_id].tokensAmount,
            "Platform: invalid _amount"
        );
        require(
            roundStatus == RoundStatus.TRADE,
            "Platform: only trade round function"
        );

        uint256 spendedETH = (orders[_id].price / orders[_id].tokensAmount) *
            _amount;
        require(msg.value >= spendedETH, "Platform: not enough funds");
        uint256 refund = msg.value - spendedETH;

        if (refund > 0) {
            msg.sender.call{value: refund}("");
        }

        uint256 PLATFORM_FEE = 5;
        orders[_id].seller.call{
            value: spendedETH - ((spendedETH * PLATFORM_FEE) / 100)
        }("Seller ether");

        address firstReferer = users[orders[_id].seller].referer;
        if (firstReferer != address(0)) {
            uint256 REFERER_FEE = 25;
            address secondReferer = users[firstReferer].referer;
            if (secondReferer != address(0)) {
                secondReferer.call{value: (spendedETH * REFERER_FEE) / 1000}(
                    "Percentage of second referer"
                );
            }

            firstReferer.call{value: (spendedETH * REFERER_FEE) / 1000}(
                "Percentage of first referer"
            );
        }

        IERC20(token).safeTransfer(msg.sender, _amount);
        tradeStock += spendedETH;

        orders[_id].tokensAmount -= _amount;
        orders[_id].price -= spendedETH;
        if (orders[_id].tokensAmount == 0) {
            orders[_id].closed = true;
        }
    }
}
