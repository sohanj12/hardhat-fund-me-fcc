const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("0.5")
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", function () {
        it("sets the aggregator address correctly", async function () {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", function () {
        //arrange
        //act
        //assert
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })

        it("Updates the amount funded in the data strcuture", async () => {
            await fundMe.fund({ value: sendValue })
            const fundsAddedByCaller = await fundMe.getAddressToAmountFunded(
                deployer
            )
            assert.equal(fundsAddedByCaller.toString(), sendValue.toString())
        })
        it("Adds funders to array of funders", async () => {
            await fundMe.fund({ value: sendValue })
            funderAddress = await fundMe.getFunder(0)
            assert.equal(funderAddress, deployer)
        })
    })

    describe("withdraw", function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })
        it("withdraws funds from a single funder", async () => {
            //arrange
            const funderStartingBalance = await fundMe.provider.getBalance(
                deployer
            )
            const fundMeStartingBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            //act
            const txResponse = await fundMe.withdraw()
            const txReceipt = await txResponse.wait()
            const { gasUsed, effectiveGasPrice } = txReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const fundMeFinalBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const funderFinalBalance = await fundMe.provider.getBalance(
                deployer
            )
            //assert

            assert.equal(fundMeFinalBalance.toString(), 0)
            assert.equal(
                fundMeStartingBalance.add(funderStartingBalance).toString(),
                funderFinalBalance.add(gasCost).toString()
            )
        })

        it("reverts when another non owner account tries to withdraw", async () => {
            const accounts = await ethers.getSigners()
            const nonOwnerConnected = await fundMe.connect(accounts[1])
            await expect(nonOwnerConnected.withdraw()).to.be.reverted

            await expect(
                nonOwnerConnected.withdraw()
            ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
        })
    })
})
