const { network, ethers, getNamedAccounts, deployments } = require("hardhat");
const { networks } = require("../hardhat.config");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_SUB_AMOUNT = ethers.utils.parseEther("30");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    // funding our subscription
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }
  const gasLane = networkConfig[chainId]["gasLane"];
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const interval = networkConfig[chainId]["interval"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];

  console.log(`1---------${gasLane}`);
  console.log(`2---------${entranceFee}`);
  console.log(`3---------${interval}`);
  console.log(`4---------${callbackGasLimit}`);

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock");
    await vrfCoordinatorV2.addConsumer(subscriptionId, raffle.address);
  }

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying");
    await verify(raffle.address, args);
  }
  log("--------------------------------------------------------");
};

module.exports.tags = ["all", "raffle"];
