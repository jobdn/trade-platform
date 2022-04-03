//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ACDMPlatform is ReentrancyGuard {
    uint256 public ACDM_AMOUNT;
    address public _ACDMToken;
    uint256 public _roundTime;
    uint256 public _tradeStock;
    RoundStatus public _roundStatus;
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

    constructor(address ACDMToken, uint256 roundTime) {
        _ACDMToken = ACDMToken;
        _roundTime = roundTime;
        _roundStatus = RoundStatus.SALE;
        ACDM_AMOUNT = 10**5;
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
        _roundStatus = RoundStatus.SALE;
    }

    /**
        @notice User can buy ACDM tokens for ETH
     */
    function buyACDM() public payable nonReentrant {
        require(msg.value > 0, "Platfrom: zero msg.value");
        require(_roundStatus == RoundStatus.SALE, "Platform: only sale round");
    }
}
