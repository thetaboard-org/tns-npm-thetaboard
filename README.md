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
```

### Get address record from a domain name
To get the address record from a domain name use the ```getAddressRecord``` function such as: 
```js script
import { getAddressRecord } from "thetaboard-tns";

const address = await getAddressRecord(domainName);
return address.addressRecord;
```
