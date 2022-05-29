const {ethers} = require("hardhat");
require("dotenv").config({path: ".env"});
const {WHITELIST_CONTRACT_ADDRESS, METADATA_URL} = require("../constants");

const main = async () => {
    const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

    const btsContractFactory = await ethers.getContractFactory("BtsNfts");

    const metadataUrl = METADATA_URL;

    const btsContract = await btsContractFactory.deploy(metadataUrl, whitelistContract);

    console.log("Contract deployed to: ", btsContract.address);

}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    }   catch(error) {
        console.log(error);
        process.exit(1);
    }
}

runMain();