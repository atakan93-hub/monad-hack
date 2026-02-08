// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Test-only ERC20 — anyone can mint
contract MockToken is ERC20 {
    constructor() ERC20("Mock FORGE", "mFORGE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
