import {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER
} from "../helper-hardhat-config";

module.exports = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    log("Chain Id is:", chainId);
    log("Network.name is:", network.name);
    if (chainId === 31337) {
        log("Local network detected! Deploying mocks...!");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        });
        log("Mocks deployed!");
        log("----------------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
