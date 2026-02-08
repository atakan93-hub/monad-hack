// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/Arena.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address forgeToken = vm.envAddress("FORGE_TOKEN");
        address treasury = vm.envAddress("TREASURY");
        uint256 feeRate = vm.envOr("FEE_RATE", uint256(250)); // default 2.5%

        vm.startBroadcast(deployerKey);

        Escrow escrow = new Escrow(forgeToken, feeRate, treasury);
        Arena arena = new Arena(forgeToken);

        vm.stopBroadcast();

        console.log("Escrow:", address(escrow));
        console.log("Arena:", address(arena));
    }
}
