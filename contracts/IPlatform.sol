//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IPlatform {
    enum RoundStatus {
        SALE,
        TRADE
    }

    struct User {
        address referer;
        bool isReferer;
    }

    struct Order {
        uint256 tokensInOrder;
        uint256 price;
        address seller;
        bool closed;
    }
    error NotExpiredTimeError(string errorMsg);
    error TradeError(string errorMsg);

    event OrderAdded(
        address indexed seller,
        uint256 indexed amount,
        uint256 price
    );
    event OrderRedeemed(
        address indexed buyer,
        uint256 indexed id,
        uint256 amount
    );
    event OrderClosed(address indexed buyer, uint256 indexed id);
    event TokensSold(address indexed buyer, uint256 amount);

    /* @notice User needs to call this function to become referer
     * @param _referer Address of referer
     */
    function register(address _referer) external;

    /**
     *  @notice Starts Sale round
     */
    function startSaleRound() external;

    /**
     *  @notice Starts Trade round
     *  @dev This function can be called before expiration of sale round
     *      When all tokens are sold or 'tradeStock' is equal to zero
     *
     *      At least one token must be sold in the first sale round
     */
    function startTradeRound() external;

    /**
     * @notice User can buy ACDM tokens for ETH
     * @dev If user sends tokens more than necessary, then the excess is sent back
     * @param _amount Amount of purchased tokens
     */
    function buyToken(uint256 _amount) external payable;

    /**
     * @notice Adds orders
     * @dev To add order user needs to buy tokens in sale round
     * @param _amount Amount of tokens for trade rount
     * @param  _price Price for amount of tokens
     */
    function addOrder(uint256 _amount, uint256 _price) external;

    /**
     * @notice Redeems _amount tokens from the order by id
     * @dev When user redeems some tokens from the order he receives 95% of entire price of the order
     * @param _id Order id
     * @param _amount Amount of buyed tokens from the order
     */
    function redeemOrder(uint256 _id, uint256 _amount) external payable;

    /**
     *  @notice Removes order by id
     *  @param _id Order id
     */
    function removeOrder(uint256 _id) external;
}
