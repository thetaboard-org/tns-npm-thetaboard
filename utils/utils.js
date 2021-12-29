
import { normalize } from 'eth-ens-namehash'
import bs58 from 'bs58'
import contentHash from 'content-hash'
import { ethers } from "ethers";
const sha3 = require('js-sha3').keccak_256

const supportedCodecs = ['ipns-ns', 'ipfs-ns', 'swarm-ns', 'onion', 'onion3']

  
function decodeLabelhash(hash) {
    if (!(hash.startsWith('[') && hash.endsWith(']'))) {
      throw Error(
        'Expected encoded labelhash to start and end with square brackets'
      )
    }
  }
export function namehash(inputName) {
    let node = ''
    for (let i = 0; i < 32; i++) {
      node += '00'
    }
  
    if (inputName) {
      const labels = inputName.split('.')
  
      for (let i = labels.length - 1; i >= 0; i--) {
        let labelSha
        if (isEncodedLabelhash(labels[i])) {
          labelSha = decodeLabelhash(labels[i])
        } else {
          let normalisedLabel = normalize(labels[i])
          labelSha = sha3(normalisedLabel)
        }
        node = sha3(new Buffer(node + labelSha, 'hex'))
      }
    }
  
    return '0x' + node
  }

function isEncodedLabelhash(hash) {
    return hash.startsWith('[') && hash.endsWith(']') && hash.length === 66
  }
  


export function labelhash(unnormalisedLabelOrLabelhash) {
    return isEncodedLabelhash(unnormalisedLabelOrLabelhash)
      ? '0x' + decodeLabelhash(unnormalisedLabelOrLabelhash)
      : '0x' + sha3(normalize(unnormalisedLabelOrLabelhash))
  }

export function encodeContenthash(text) {
  let content, contentType
  let encoded = false
  if (!!text) {
    let matched =
      text.match(/^(ipfs|ipns|bzz|onion|onion3):\/\/(.*)/) ||
      text.match(/\/(ipfs)\/(.*)/) ||
      text.match(/\/(ipns)\/(.*)/)
    if (matched) {
      contentType = matched[1]
      content = matched[2]
    }
    try {
      if (contentType === 'ipfs') {
        if (content.length >= 4) {
          encoded = '0x' + contentHash.encode('ipfs-ns', content)
        }
      } else if (contentType === 'ipns') {
        let bs58content = bs58.encode(
          Buffer.concat([
            Buffer.from([0, content.length]),
            Buffer.from(content),
          ])
        )
        encoded = '0x' + contentHash.encode('ipns-ns', bs58content)
      } else if (contentType === 'bzz') {
        if (content.length >= 4) {
          encoded = '0x' + contentHash.fromSwarm(content)
        }
      } else if (contentType === 'onion') {
        if (content.length === 16) {
          encoded = '0x' + contentHash.encode('onion', content)
        }
      } else if (contentType === 'onion3') {
        if (content.length === 56) {
          encoded = '0x' + contentHash.encode('onion3', content)
        }
      } else {
        console.warn('Unsupported protocol or invalid value', {
          contentType,
          text,
        })
      }
    } catch (err) {
      console.warn('Error encoding content hash', { text, encoded })
      //throw 'Error encoding content hash'
    }
  }
  return encoded
}

export function decodeContenthash(encoded) {
  let decoded, protocolType, error
  if (encoded.error) {
    return { protocolType: null, decoded: encoded.error }
  }
  if (encoded) {
    try {
      decoded = contentHash.decode(encoded)
      const codec = contentHash.getCodec(encoded)
      if (codec === 'ipfs-ns') {
        protocolType = 'ipfs'
      } else if (codec === 'ipns-ns') {
        decoded = bs58.decode(decoded).slice(2).toString()
        protocolType = 'ipns'
      } else if (codec === 'swarm-ns') {
        protocolType = 'bzz'
      } else if (codec === 'onion') {
        protocolType = 'onion'
      } else if (codec === 'onion3') {
        protocolType = 'onion3'
      } else {
        decoded = encoded
      }
    } catch (e) {
      error = e.message
    }
  }
  return { protocolType, decoded, error }
}

export function isValidContenthash(encoded) {
  try {
    const codec = contentHash.getCodec(encoded)
    return ethers.utils.isHexString(encoded) && supportedCodecs.includes(codec)
  } catch (e) {
    console.log(e)
  }
}