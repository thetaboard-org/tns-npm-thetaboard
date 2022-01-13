import { ethers } from "ethers";
import { labelhash, namehash, decodeContenthash, encodeContenthash } from "./utils/utils";
import { formatsByCoinType } from '@ensdomains/address-encoder';

const registrarABI = require("./contracts/BaseRegistrarImplementation.json")
const registryABI = require("./contracts/ENSregistryABI.json")
const resolverABI = require("./contracts/PublicResolver.json")
const controllerABI = require("./contracts/RegistrarController.json")
const reverseABI = require("./contracts/ReverseRegistrar.json")


const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()
const address = signer.getAddress()

const ensResolver = "0x6f26Cf9D0968dA19d7AA85Cb69d088746bFA93B0"

const registryContract = new ethers.Contract("0xf1ea88e6AFE2fc6502Ef71aE794D7555C6aedA2d", registryABI, signer)
const registrarContract = new ethers.Contract("0x7647BDAE510a2f0060C49D7beC783547b90DF2f9", registrarABI, signer)
const resolverContract = new ethers.Contract("0x6f26Cf9D0968dA19d7AA85Cb69d088746bFA93B0", resolverABI, signer)
const controllerContract = new ethers.Contract("0x8ff4635F7bC36c08FbD68926A90d9f0bB7E9581C", controllerABI, signer)
const reverseRegistrarContract = new ethers.Contract("0xa55706e1deC351eE44fF6493Bdb9e5BdA8588f20", reverseABI, signer)

// Checks if domain is available. 
export const isDomainAvailable = async(domain) => {
    try {
        const available = await controllerContract.available(domain)
        return {
            available: available
        }
    } catch (e) {
        console.log(`Error isDomainAvailable for controllerContract`, e)
        return {
            available: false
        }
    }
}

//Returns owner/registrant of domain.
export const getRegistrant = async(domain) => {
    try {
        const label = ethers.BigNumber.from(labelhash(domain)).toString()
        const output = await registrarContract.ownerOf(label)
        return {
            registrant: output
        }
    } catch (e) {
        console.log(`Error getRegistrant for registrarContract`, e)
        return {
            registrant: null
        }
    }
}

//Returns controller of domain
export const getController = async(domain) => {
    try {
        const label = namehash(domain + ".theta")
       const output = await registryContract.owner(label)
        return {
            controller: output
        }
    } catch (e) {
        console.log(`Error getController for registryContract`, e)
        return {
            controller: null
        }
    }
}

//Returns record address of domain(same as registrant address as default) || equivalent to eth address in ens.
export const getAddressRecord = async(domain) => {
    try {
        const label = namehash(domain + ".theta")
        const addressRecord = await resolverContract['addr(bytes32)'](label)
        return { 
            addressRecord: addressRecord
        }    
    } catch (e) {
        console.log(`Error getAddressRecord for resolverContract`, e)
        return {
            addressRecord: null
        }
    }
}

//Returns url of domain. If not set will return nothing.
export const getText = async(domain, key) => {
    try {
        const label = namehash(domain + ".theta")
        const text = await resolverContract['text(bytes32,string)'](label, key)
        return {
            text: text
        }
    } catch (e) {
        console.log(`Error getText for resolverContract`, e)
        return {
            text: null
        }
    }
}

//Gets content hash of domain.
export const getContentHash = async(domain) => {
    try {
        const name = namehash(domain + ".theta")
        const content = await resolverContract.contenthash(name)
        const { protocolType, decoded, error } = decodeContenthash(content)
        let contentHash;
        if (typeof decoded != "undefined") {
            contentHash = protocolType + "://" + decoded
        }
        return {
            contentHash: contentHash
        }
    } catch (e) {
        console.log(`Error getContentHash for resolverContract`, e)
        return {
            contentHash: null
        }
    }
 }

 //Registers a domain.
export const registerDomain = async(domain, secret) => {
    try {
        const price = await controllerContract.rentPrice(domain)
        const signerAddress = await signer.getAddress()

        const tx = await controllerContract.registerWithConfig(domain, signerAddress, secret, ensResolver, signerAddress, {value: price, gasPrice: 4000000000000, gasLimit: 2000000})
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error registerDomain for controllerContract`, e)
        return {
            tx: null
        }
    }
}

// commit new name for registration
export const commitDomain = async(domain, secret) => {
    try {
        const signerAddress = await signer.getAddress()
        const commitment = await controllerContract.makeCommitmentWithConfig(domain, 
            signerAddress, 
            secret, 
            ensResolver, 
            signerAddress
        )
        var tx = await controllerContract.commit(commitment)
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error commitDomain for controllerContract`, e)
        return {
            tx: null
        }
    }
}

// get timestamp from commit
export const getCommitmentTimestamp = async(domain, secret) => {
    try {
        const signerAddress = await signer.getAddress()
        var commitment = await controllerContract.makeCommitmentWithConfig(domain, 
            signerAddress, 
            secret,
            ensResolver, 
            signerAddress)
        var commitmentTimestamp = await controllerContract.commitments(commitment)
        return {
            commitmentTimestamp: commitmentTimestamp
        }
    } catch (e) {
        console.log(`Error getCommitmentTimestamp for controllerContract`, e)
        return {
            commitmentTimestamp: 0
        }
    }
}


//Transfers controller. Registrant can change controller anytime he wants.
export const changeController = async(domain, newAddress) => {
    try {
        const label = namehash(domain + ".theta")
        const tx = await registryContract.setOwner(label, newAddress)
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error changeController for registryContract`, e)
        return {
            tx: null
        }
    }
}

//Transfers registrant. If you transfer registrant you cannot get back the domain.
export const changeRegistrant = async(domain, newAddress) => {
    try {
        const label = ethers.BigNumber.from(labelhash(domain)).toString()
        const tx = await registrarContract.transferFrom(address, newAddress, label)
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error changeRegistrant for registrarContract`, e)
        return {
            tx: null
        }
    }
}

//Sets record address || equivalent to eth address in ens.
export const setAddressRecord = async(domain, recordAddress) => {
    try {
        const label = namehash(domain + ".theta")
        const tx = await resolverContract['setAddr(bytes32,address)'](label, recordAddress, {gasPrice: 4000000000000, gasLimit: 20000000})
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error setAddressRecord for resolverContract`, e)
        return {
            tx: null
        }
    }
}
//Sets url for domain.
export const setText = async(domain, text, key) => {
    try {
        const label = namehash(domain + ".theta")
        const tx = await resolverContract['setText(bytes32,string,string)'](label, key, text, {gasPrice: 4000000000000, gasLimit: 20000000})
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error setText for resolverContract`, e)
        return {
            tx: null
        }
    }
}
//Sets content hash. ipfs://dsfdbd...
export const setContentHash = async(domain, content) => {
    try {
        const label = namehash(domain + ".theta")
        const encodedContenthash = encodeContenthash(content)
        const tx = await resolverContract.setContenthash(label, encodedContenthash)
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error setContentHash for resolverContract`, e)
        return {
            tx: null
        }
    }
}

//Get reverse name of address. Returns nothing if user has not set it.
export const getReverseName = async(reverseAddress) => {
    try {
        const reverseNode = `${reverseAddress.slice(2)}.addr.reverse`
        const reverseNamehash = namehash(reverseNode)
        const domain = await resolverContract.name(reverseNamehash)
        if (domain) {
            const addressRecord = await getAddressRecord(domain)
            if (addressRecord.addressRecord == reverseAddress) {
                return {
                    domain: domain
                }
            }
        }
        return {
            domain: null
        }
    } catch (e) {
        console.log(`Error getReverseName for resolverContract`, e)
        return {
            domain: null
        }
    }
}

//User sets the name for his address.
export const setReverseName = async(name, address) => {
    try {
        const ownerOfDomain = await getController(name.replace(".theta", ""))
        if (ownerOfDomain.controller == address) {
            const tx = await reverseRegistrarContract.setName(name)
            tx.wait(1)
            return {
                tx: tx
            }
        } else {
            throw {
                error: true,
                message: "You are not the owner of this domain"
            }
        }
    } catch (e) {
        console.log(`Error setReverseName for reverseRegistrarContract`, e)
        return {
            tx: null
        }
    }

}

export const setBitcoinAddress = async(domain, BTCaddress) => {
    try {
        const data = formatsByCoinType[0].decoder(BTCaddress)
        const name = namehash(domain + ".theta")
        const tx = await resolverContract['setAddr(bytes32,uint256,bytes)'](name, 0, data)
        tx.wait(1)
        return {
            tx: tx
        }
    } catch (e) {
        console.log(`Error setBitcoinAddress for resolverContract`, e)
        return {
            tx: null
        }
    }
}

export const getBitcoinAddress = async(domain) => {
    try {
        const name = namehash(domain + ".theta")
        const data = await resolverContract['addr(bytes32,uint256)'](name, 0)
        if (data == "0x") {
            return {
                btcAddress: null
            }
        }
        const btcAddress = formatsByCoinType[0].encoder(Buffer.from(data.slice(2), 'hex'))
        return {
            btcAddress: btcAddress
        }
    } catch (e) {
        console.log(`Error getBitcoinAddress for resolverContract`, e)
        return {
            btcAddress: null
        }
    }
}

export const getPrice = async(_name) => {
    try {
        const _cost = await controllerContract.rentPrice(_name)
        const price = ethers.BigNumber.from(_cost).toString()
        return {
            price: ethers.utils.formatEther(price)
        }
    } catch (e) {
        console.log(`Error getPrice for controllerContract`, e)
        return {
            price: null
        }
    }

}
