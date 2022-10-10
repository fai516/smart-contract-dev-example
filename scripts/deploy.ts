import hre from "hardhat";

async function main() {
  console.log("Selected network: ", hre.network.name);
  const [owner] = await hre.ethers.getSigners();

  // Get the contract to deploy
  //CampaignMintableV0
  const Campaign = await hre.ethers.getContractFactory("CampaignV1");
  const campaign = await Campaign.deploy(
    "https://api.metazons.com/metadata",
    "https://api.metazons.com/metadata",
    42,
    1642579200,
    1646121600 // 01 March 2022 00:00:00 PST
  );
  await campaign.deployed();
  console.log("Deploy proposer: ", owner.address);
  console.log("Block Number:", campaign.deployTransaction.blockNumber);
  console.log("Transaction Id:", campaign.deployTransaction.hash);
  console.log("Contract address:", campaign.address);
  console.log("Contract owner: ", await campaign.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
