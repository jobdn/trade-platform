//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./test/TradeToken.sol";
import "./IPlatform.sol";

contract TradePlatform is IPlatform, ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 public INITIAL_TOKEN_AMOUNT;
    uint256 public roundTime;
    uint256 public tradeStock;
    uint256 public roundStartTime;
    uint256 public roundEndTime;
    uint256 public tokenPrice;
    uint256 public tokens;
    address public token;
    bool public firstTradeRound;
    mapping(address => User) public users;
    RoundStatus public roundStatus;
    Order[] public orders;

    constructor(address _token, uint256 _roundTime) {
        require(_token != address(0), "Platform: invalid token");
        require(_roundTime != 0, "Platform: invalid round time");
        token = _token;
        roundTime = _roundTime;
        roundStatus = RoundStatus.TRADE;
        INITIAL_TOKEN_AMOUNT = 10**5;
        firstTradeRound = true;
    }

    function register(address _referer) public override {
        require(msg.sender != _referer, "Platform: invalid referer");
        require(!users[msg.sender].isReferer, "Platform: already referer");

        users[msg.sender].isReferer = true;

        if (_referer != address(0)) {
            require(
                users[_referer].isReferer,
                "Platform: not existent referer"
            );
            users[msg.sender].referer = _referer;
        }
    }

    function startSaleRound() public override {
        require(
            roundStatus == RoundStatus.TRADE,
            "Platform: trade round is not over"
        );
        require(
            block.timestamp > roundEndTime,
            "Platform: time of the last round is not over"
        );

        roundStatus = RoundStatus.SALE;
        if (firstTradeRound) {
            // Sale round starts for the first time
            tokenPrice = 1 ether / INITIAL_TOKEN_AMOUNT;
            tokens = INITIAL_TOKEN_AMOUNT;
        } else {
            if (tradeStock == 0) {
                startTradeRound();
            } else {
                tokenPrice = (tokenPrice * 103) / 100 + 4 * 10**12;
                tokens = tradeStock / tokenPrice;
            }
        }
        TradeToken(token).mint(address(this), tokens);
        roundStartTime = block.timestamp;
        roundEndTime = roundStartTime + roundTime;
    }

    function startTradeRound() public {
        require(
            roundStatus == RoundStatus.SALE,
            "Platform: sale round is not over"
        );

        if (tokens == INITIAL_TOKEN_AMOUNT && firstTradeRound) {
            revert TradeError(
                "Platform: nothing to trade in the first trade round"
            );
        }
        if (block.timestamp <= roundEndTime && tokens != 0) {
            revert NotExpiredTimeError(
                "Platform: time of the last round is not over or amount of tokens is not zero"
            );
        }

        TradeToken(token).burn(address(this), tokens);
        tokens = 0;
        tradeStock = 0;
        firstTradeRound = false;
        roundStartTime = block.timestamp;
        roundEndTime = roundStartTime + roundTime;
        roundStatus = RoundStatus.TRADE;
    }

    function buyToken(uint256 _amount) public payable override nonReentrant {
        require(
            _amount <= tokens,
            "Platform: not enough tokens on the plaftorm"
        );
        require(
            msg.value >= _amount * tokenPrice,
            "Platform: not enough funds"
        );

        uint256 refund = msg.value - tokenPrice * _amount;
        if (refund > 0) {
            msg.sender.call{value: refund}("");
        }

        address firstReferer = users[msg.sender].referer;
        if (firstReferer != address(0)) {
            address secondReferer = users[firstReferer].referer;
            if (secondReferer != address(0)) {
                uint256 SECOND_REFERER_FEE = 3;
                secondReferer.call{
                    value: (_amount * tokenPrice * SECOND_REFERER_FEE) / 100
                }("");
            }
            uint256 FIRST_REFERER_FEE = 5;
            firstReferer.call{
                value: (_amount * tokenPrice * FIRST_REFERER_FEE) / 100
            }("");
        }

        IERC20(token).safeTransfer(msg.sender, _amount);
        tokens -= _amount;
        if (tokens == 0) {
            startTradeRound();
        }

        emit TokensSold(msg.sender, _amount);
    }

    modifier onlyTradeRound() {
        require(
            roundStatus == RoundStatus.TRADE,
            "Platform: only trade round function"
        );
        _;
    }

    function addOrder(uint256 _amount, uint256 _price) public onlyTradeRound {
        require(_amount != 0, "Platform: zero funds are sent");
        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
        orders.push(
            Order({
                tokensInOrder: _amount,
                price: _price,
                seller: msg.sender,
                closed: false
            })
        );

        emit OrderAdded(msg.sender, _amount, _price);
    }

    function redeemOrder(uint256 _id, uint256 _amount)
        public
        payable
        nonReentrant
        onlyTradeRound
    {
        require(_id < orders.length, "Platform: invalid order");
        require(!orders[_id].closed, "Platform: closed order");
        require(
            _amount <= orders[_id].tokensInOrder,
            "Platform: invalid _amount"
        );

        uint256 spendedETH = (orders[_id].price / orders[_id].tokensInOrder) *
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
                    ""
                );
            }

            firstReferer.call{value: (spendedETH * REFERER_FEE) / 1000}("");
        }

        IERC20(token).safeTransfer(msg.sender, _amount);

        orders[_id].tokensInOrder -= _amount;
        orders[_id].price -= spendedETH;
        tradeStock += spendedETH;
        if (orders[_id].tokensInOrder == 0) {
            orders[_id].closed = true;
            emit OrderClosed(msg.sender, _id);
        }

        emit OrderRedeemed(msg.sender, _id, _amount);
    }

    function removeOrder(uint256 _id) public nonReentrant onlyTradeRound {
        require(_id < orders.length, "Platform: invalid order");
        require(msg.sender == orders[_id].seller, "Platform: not seller");
        require(!orders[_id].closed, "Platform: closed order");
        orders[_id].closed = true;
        IERC20(token).transfer(msg.sender, orders[_id].tokensInOrder);

        emit OrderClosed(msg.sender, _id);
    }
}
