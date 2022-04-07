import { ethers } from "hardhat";
import { TradePlatform__factory } from "../typechain-types";
import { config } from "../config";
async function main() {
  const [signer] = await ethers.getSigners();
  const platform = await new TradePlatform__factory(signer).deploy(
    config.TOKEN,
    config.ROUND_TIME
  );

  await platform.deployed();

  console.log("Trade platform deployed to:", platform.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
