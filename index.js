import { ethers } from "ethers";
import { labelhash, namehash, decodeContenthash, encodeContenthash } from "./utils/utils";
import { formatsByCoinType } from '@ensdomains/address-encoder';

const registrarABI = require("./contracts/BaseRegistrarImplementation.json");
const registryABI = require("./contracts/ENSregistryABI.json");
const resolverABI = require("./contracts/PublicResolver.json");
const controllerABI = require("./contracts/RegistrarController.json");
const reverseABI = require("./contracts/ReverseRegistrar.json");


const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const address = signer.getAddress();

const ensResolver = "0x2659b8A601329C880D9A44d77d9767EBa10F8c41";

const registryContract = new ethers.Contract("0x0367aaFd5A6e787E3D717619b43514eAE667Bc69", registryABI, signer)
const registrarContract = new ethers.Contract("0xf373FD65e4d7E8A04126847C11E86E77fb17096c", registrarABI, signer)
const resolverContract = new ethers.Contract("0x2659b8A601329C880D9A44d77d9767EBa10F8c41", resolverABI, signer)
const controllerContract = new ethers.Contract("0x2175465d989806E0Dd6422f6f226427a26a5b246", controllerABI, signer)
const reverseRegistrarContract = new ethers.Contract("0x92252B0355f787FFA7cBaCE9Db6804e2e4D653D6", reverseABI, signer)

// Checks if domain is available. 
export const isDomainAvailable = async(domain) => {
    const available = await controllerContract.available(domain)
    return available
}

//Returns owner/registrant of domain.
export const getRegistrant = async(domain) => {
    const label = ethers.BigNumber.from(labelhash(domain)).toString()
    const output = await registrarContract.ownerOf(label)
    return output
}

//Returns controller of domain
export const getController = async(domain) => {
    const label = namehash(domain + ".theta")
    const output = await registryContract.owner(label)
    return output
}

//Returns record address of domain(same as registrant address as default) || equivalent to eth address in ens.
export const getAddressRecord = async(domain) => {
    const label = namehash(domain + ".theta")
    const recordAddress = await resolverContract['addr(bytes32)'](label)
    return recordAddress
}

//Returns url of domain. If not set will return nothing.
export const getText = async(domain, key) => {
    const label = namehash(domain + ".theta")
    const link = await resolverContract['text(bytes32,string)'](label, key)
    return link
}

//Gets content hash of domain.
export const getContentHash = async(domain) => {
    const name = namehash(domain + ".theta")
    const content = await resolverContract.contenthash(name)
    const { protocolType, decoded, error } = decodeContenthash(content)
    let contentHash;
    if (typeof decoded != "undefined") {
        contentHash = protocolType + "://" + decoded
    }
    return contentHash
 }

 //Registers a domain.
export const registerDomain = async(domain, secret) => {
    const price = await controllerContract.rentPrice(domain)
    const signerAddress = await signer.getAddress()

    const tx = await controllerContract.registerWithConfig(domain, signerAddress, secret, ensResolver, signerAddress, {value: price, gasPrice: 4000000000000, gasLimit: 2000000});
    tx.wait(1)
}

// commit new name for registration
export const commitDomain = async(domain, secret) => {
    try {
        const signerAddress = await signer.getAddress()
        debugger
        const commitment = await controllerContract.makeCommitmentWithConfig(domain, 
            signerAddress, 
            secret, 
            ensResolver, 
            signerAddress
        );
        debugger
        var tx = await controllerContract.commit(commitment);
        debugger
        tx.wait(1);
        debugger
        return {
            tx: tx
        };
    } catch (e) {
        console.log(`Error commitDomain for controllerContract`, e);
        return {
            tx: null
        };
    }
}

// get timestamp from commit
export const getCommitmentTimestamp = async(domain, secret) => {
    try {
        debugger
        const signerAddress = await signer.getAddress()
        var commitment = await controllerContract.makeCommitmentWithConfig(domain, 
            signerAddress, 
            secret,
            ensResolver, 
            signerAddress);
        var commitmentTimestamp = await controllerContract.commitments(commitment);
        debugger

        return {
            commitmentTimestamp: commitmentTimestamp
        };
    } catch (e) {
        console.log(`Error getCommitmentTimestamp for controllerContract`, e);
        return {
            commitmentTimestamp: 0
        };
    }
}


//Transfers controller. Registrant can change controller anytime he wants.
export const changeController = async(domain, newAddress) => {
    const label = namehash(domain + ".theta")
    const tx = await registryContract.setOwner(label, newAddress)
    tx.wait(1)
}

//Transfers registrant. If you transfer registrant you cannot get back the domain.
export const changeRegistrant = async(domain, newAddress) => {
    const label = ethers.BigNumber.from(labelhash(domain)).toString()

    const tx = await registrarContract.transferFrom(address, newAddress, label)
    tx.wait(1)
}

//Sets record address || equivalant to eth address in ens.
export const setAddressRecord = async(domain, recordAddress) => {
    const label = namehash(domain + ".theta")
    const tx = await resolverContract['setAddr(bytes32,address)'](label, recordAddress, {gasPrice: 4000000000000, gasLimit: 20000000})
    tx.wait(1)
}
//Sets url for domain.
export const setText = async(domain, text, key) => {
    const label = namehash(domain + ".theta")
    const tx = await resolverContract['setText(bytes32,string,string)'](label, key, text, {gasPrice: 4000000000000, gasLimit: 20000000})
    tx.wait(1)
}
//Sets content hash. ipfs://dsfdbd...
export const setContentHash = async(domain, content) => {
    const label = namehash(domain + ".theta")
    const encodedContenthash = encodeContenthash(content)
  
    const tx = await resolverContract.setContenthash(label, encodedContenthash)
    tx.wait(1)
  }

//Get reverse name of address. Returns nothing if user has not set it.
export const getReverseName = async(reverseAddress) => {
    const reverseNode = `${reverseAddress.slice(2)}.addr.reverse`
    const reverseNamehash = namehash(reverseNode)
    const domain = await resolverContract.name(reverseNamehash)
    return domain
}

//User sets the name for his address.
export const setReverseName = async(name, address) => {
    const ownerOfDomain = await getController(name.replace(".theta", ""))
    if (ownerOfDomain == address) {
        const tx = await reverseRegistrarContract.setName(name)
        tx.wait(1)
    } else {
        alert("You are not the owner of this domain")
    }
}

export const setBitcoinAddress = async(domain, BTCaddress) => {
    const data = formatsByCoinType[0].decoder(BTCaddress);
    const name = namehash(domain + ".theta")
    const tx = await resolverContract['setAddr(bytes32,uint256,bytes)'](name, 0, data)
    tx.wait(1)
}

export const getBitcoinAddress = async(domain) => {
    const name = namehash(domain + ".theta")
    const data = await resolverContract['addr(bytes32,uint256)'](name, 0)
    if (data == "0x") {
        return ""
    }
    const address = formatsByCoinType[0].encoder(Buffer.from(data.slice(2), 'hex'))
    return address
}

export const getPrice = async(_name) => {
    const _cost = await controllerContract.rentPrice(_name);
    const price = ethers.BigNumber.from(_cost).toString()
    return ethers.utils.formatEther(price);
}