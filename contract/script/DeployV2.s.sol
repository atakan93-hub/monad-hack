// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaV2.sol";

contract DeployV2Script is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address forgeToken = vm.envAddress("FORGE_TOKEN");
        uint256 minTopics = vm.envOr("MIN_TOPICS", uint256(3));
        uint256 minVoteWeight = vm.envOr("MIN_VOTE_WEIGHT", uint256(100 ether));

        vm.startBroadcast(deployerKey);

        ArenaV2 arenaV2 = new ArenaV2(forgeToken, minTopics, minVoteWeight);

        vm.stopBroadcast();

        console.log("ArenaV2:", address(arenaV2));
        console.log("  forgeToken:", forgeToken);
        console.log("  minTopics:", minTopics);
        console.log("  minVoteWeight:", minVoteWeight);
    }
}
