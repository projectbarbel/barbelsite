---
id: version-1.4.0-bitemporal
title: Mode Bitemporal
sidebar_label: Mode BITEMPORAL
original_id: bitemporal
---
`BarbelHisto` does also support a second mode that does not use plain POJOs: `BarbelMode.BITEMPORAL`. In this mode classes implement the interface `Bitemporal` and declare the `BitemporalStamp` as a member field. This is an example class implementing the `Bitemporal` interface:
```java
public class DefaultDocument implements Bitemporal {

    @DocumentId
    private String id;
    private BitemporalStamp bitemporalStamp;
    private String data;

    @Override
    public BitemporalStamp getBitemporalStamp() {
        return bitemporalStamp;
    }

    @Override
    public void setBitemporalStamp(BitemporalStamp stamp) {
        this.bitemporalStamp = stamp;
    }

    //... constructors and so forth
}    
``` 
Clients have to activate `BarbelMode.BITEMPORAL` by setting the mode during construction of the `BarbelHisto` instance.
```java
BarbelHisto<DefaultDocument> histo = 
                   BarbelHistoBuilder.barbel()
                   .withMode(BarbelMode.BITEMPORAL).build();
``` 
There is no proxying magic applied in `BarbelMode.BITEMPORAL` so everything is a bit more explicit, which can be an advantage in many situations:
* when proxying of your POJO does not work out for some unpredictable reasons
* when you shadow your data into a different data store. This may be more convenient with bitemporal objects, as they can be stored straight into the backend, rather then getting target objects and stamps from proxies.

There is nothing else to do for developers then declaring the `BitemporalStamp` and implementing `Bitemporal`. The management of the version data into the bitemporal stamp is transparent for the developer, i.e. `BarbelHisto` takes care of that. Developers are free to choose between the two `BarbelMode` options. 