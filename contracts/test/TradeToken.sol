//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TradeToken is ERC20, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
    }

    function setRoleTo(bytes memory role, address addr) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "ACDMToken: not admin");
        grantRole(keccak256(role), addr);
    }

    function mint(address owner, uint256 amount) public {
        require(hasRole(MINTER_ROLE, msg.sender), "ACDMToken: not minter");
        _mint(owner, amount);
    }

    function burn(address owner, uint256 amount) public {
        require(hasRole(BURNER_ROLE, msg.sender), "ACDMToken: not burner");
        _mint(owner, amount);
    }
}
