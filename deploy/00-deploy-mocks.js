const {network} = require("hardhat")
const {networkConfig, developmentChains, DECIMALS, INITIAL_ANSWER} = require("../helper-hardhat-config.js")

module.exports = async({getNamedAccounts, deployments}) => {
    const{deploy, log} = deployments
    const{deployer} = await getNamedAccounts()
    const chainId = network.config.chainId 

    if(developmentChains.includes(network.name)){
        log("Local networks detected. Deploying mocks.")
        await deploy("MockV3Aggregator", {
            contract:"MockV3Aggregator",
            from: deployer,
            log: true,
            args:[DECIMALS, INITIAL_ANSWER]
        })

        log("Mocks deployed.")
        log("------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]