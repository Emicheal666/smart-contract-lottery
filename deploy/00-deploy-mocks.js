const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 is the premium(cost 0.25 per request)
const GAS_PRICE_LINK = 1e9; // gas per link
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (chainId == 31337) {
    log("Local network detected, deploying mocks...");

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    });
  }
  log("Mocks Deployed");
  log("------------------------------------------------");
};

module.exports.tags = ["all", "mocks"];
