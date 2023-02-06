import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { network, deployments, ethers } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

describe("FundMe", function() {
    let fundMe: FundMe;
    let mockV3Aggregator: MockV3Aggregator;
    let deployer: SignerWithAddress;
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

        describe("constructor", function() {
            it("sets the aggregator address correctly", async () => {
                const response = await fundMe.getPriceFeed();
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
                await fundMe.fund({
                    value: ethers.utils.parseEther("1")
                });
                const response = await fundMe.getFunders(deployer.address);
                assert.equal(
                    response.toString(),
                    ethers.utils.parseEther("1").toString()
                );
            });
            it("Adds funder to array of getFunders", async function() {
                await fundMe.fund({
                    value: ethers.utils.parseEther("1")
                });
                const response = await fundMe.getFunders(0);
                assert.equal(response, deployer.address);
            });
        });

        describe("withdraw", function() {
            beforeEach(async () => {
                await fundMe.fund({
                    value: ethers.utils.parseEther("1")
                });
            });
            it("withdraw ETH from a single founder", async () => {
                // Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer.address
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
                    deployer.address
                );
                // Assert
                assert.equal(endingFundMeBalance.toString(), "0");
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance.toString())
                        .toString(),
                    endingDeployerBalance.add(gasCost).toString()
                );
            });
            // this test is overloaded. Ideally we'd split it into multiple tests
            // but for simplicity we left it as one
            it("is allows us to withdraw with multiple funders", async () => {
                // Arrange
                const accounts = await ethers.getSigners();
                await fundMe.connect(accounts[1]).fund({
                    value: ethers.utils.parseEther("1")
                });
                await fundMe.connect(accounts[2]).fund({
                    value: ethers.utils.parseEther("1")
                });
                await fundMe.connect(accounts[3]).fund({
                    value: ethers.utils.parseEther("1")
                });
                await fundMe.connect(accounts[4]).fund({
                    value: ethers.utils.parseEther("1")
                });
                await fundMe.connect(accounts[5]).fund({
                    value: ethers.utils.parseEther("1")
                });
                // Act
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer.address
                );
                const transactionResponse = await fundMe.cheaperWithdraw();
                // Let's comapre gas costs :)
                // const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait();
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
                console.log(`GasCost: ${withdrawGasCost}`);
                console.log(`GasUsed: ${gasUsed}`);
                console.log(`GasPrice: ${effectiveGasPrice}`);
                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer.address
                );
                // Assert
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(withdrawGasCost).toString()
                );
                await expect(fundMe.getFunders(0)).to.be.reverted;
                assert.equal(
                    (
                        await fundMe.getAddressToAmountFunded(
                            accounts[1].address
                        )
                    ).toString(),
                    "0"
                );
                assert.equal(
                    (
                        await fundMe.getAddressToAmountFunded(
                            accounts[2].address
                        )
                    ).toString(),
                    "0"
                );
                assert.equal(
                    (
                        await fundMe.getAddressToAmountFunded(
                            accounts[3].address
                        )
                    ).toString(),
                    "0"
                );
                assert.equal(
                    (
                        await fundMe.getAddressToAmountFunded(
                            accounts[4].address
                        )
                    ).toString(),
                    "0"
                );
                assert.equal(
                    (
                        await fundMe.getAddressToAmountFunded(
                            accounts[5].address
                        )
                    ).toString(),
                    "0"
                );
            });
            it("testing cheaperWithdraw...", async () => {
                const accounts = await ethers.getSigners();
                for (let i = 0; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    );
                    await fundMeConnectedContract.fund({
                        value: ethers.utils.parseEther("1")
                    });
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer.address
                );

                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);

                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer.address
                );

                assert.equal(endingFundMeBalance.toString(), "0");
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(gasCost).toString()
                );

                await expect(fundMe.getFunders(0)).to.be.reverted;

                for (let i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getFunders(accounts[i].address),
                        "0"
                    );
                }
            });
        });
    });
});
