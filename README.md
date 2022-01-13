# Theta Name Service

### Import
To import thetaboard-tns use the following statement:
```js script
import { getReverseName, getAddressRecord } from "thetaboard-tns";
```

### Get domain name from an address (reverse name)
To get the reverse name from an address use the ```getReverseName``` function such as: 
```js script
import { getReverseName } from "thetaboard-tns";

const reverseName = await getReverseName(domainName);
return reverseName.domain;
// will return domain name or null if no reverse name is set on this address
// i.e. "domainname"
```

### Get address record from a domain name
To get the address record from a domain name use the ```getAddressRecord``` function such as: 
```js script
import { getAddressRecord } from "thetaboard-tns";

const address = await getAddressRecord(domainName);
return address.addressRecord;
// will return the address record set for this domain
// i.e. 0x123...
```
