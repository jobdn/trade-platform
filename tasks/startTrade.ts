import { task } from "hardhat/config";
import { config } from "../config";

task("startTrade", "Starts a trade round").setAction(async (taskArgs, hre) => {
  const [signer] = await hre.ethers.getSigners();
  const platform = await hre.ethers.getContractAt(
    "TradePlatform",
    config.PLATFORM
  );

  await platform.startTradeRound();
  console.log(`${signer.address} started trade round`);
});
