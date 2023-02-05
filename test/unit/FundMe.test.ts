import { assert, expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

describe("FundMe", function() {
    let fundMe: any;
    let mockV3Aggregator: any;
    let deployer: any;
    const sendValue = ethers.utils.parseEther("1");

    beforeEach(async () => {
        // if you need accounts
        // const accounts = await ethers.getSigners();
        // const accountOne = accounts[0]
        console.log("before each");

        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe");
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator");
        console.log("went through beforeEach");
    });

    describe("constructor", function() {
        it("sets the aggregator address correctly", async function() {
            const response = await fundMe.priceFeed();
            assert.equal(response, mockV3Aggregator.address);
        });
    });

    describe("fund", function() {
        it("Fails if you don't send enough ETH", async function() {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            );
        });
        it("Updated the amount funded data structure", async function() {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.addressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds fuinder to array of funders", async function() {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.funders(0);
            assert.equal(funder, deployer);
        });
    });

    describe("withdraw", function() {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });
        it("withdraw ETH from a single founder", async () => {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );
            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);

            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );

            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );
            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance.toString()),
                endingDeployerBalance.add(gasCost).toString()
            );
        });
    });
});
