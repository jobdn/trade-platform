import { ethers } from "hardhat";
import { TradeToken__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const token = await new TradeToken__factory(signer).deploy(
    "TRADE TOKEN",
    "TRT"
  );

  await token.deployed();

  console.log("Trade token deployed to:", token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
