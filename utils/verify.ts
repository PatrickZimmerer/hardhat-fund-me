import { run } from "hardhat";

async function verify(contractAddress: any, args: any) {
    console.log("Veryfying contract...", { contractAddress, args });
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args
        });
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!");
        } else {
            console.log(error);
        }
    }
}

module.exports = { verify };
