import { task } from "hardhat/config";
import { config } from "../config";

task("startSale", "Starts a sale round").setAction(async (taskArgs, hre) => {
  const [signer] = await hre.ethers.getSigners();
  const platform = await hre.ethers.getContractAt(
    "TradePlatform",
    config.PLATFORM
  );

  await platform.startSaleRound();
  console.log(`${signer.address} started sale round`);
});
