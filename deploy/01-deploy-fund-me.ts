import { verify } from "../utils/verify";
import { networkConfig, developmentChains } from "../helper-hardhat-config";

module.exports = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    console.log("01 ", chainId);

    // let ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if (chainId === 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed!;
    }
    console.log("after if else");

    // chainId = X => address A
    // chainId = Y => address B
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1
    });
    if (chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
        log("trying to verify");
        await verify(fundMe.address, args);
        log("-----------------------------------------------------");
    }
};

module.exports.tags = ["all", "fundme"];