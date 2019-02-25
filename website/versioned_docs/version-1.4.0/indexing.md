---
id: version-1.4.0-indexing
title: Adding indexes
sidebar_label: Adding indexes
original_id: indexing
---
See the [cqengine documentation](https://github.com/npgall/cqengine) for adding indexes and then, again, add your custom collection as backbone collection as described previously using the `BarbelHistoBuilder` class. Here is an example of adding an indexed collection as backbone. First define the index field.
```java
public static final SimpleAttribute<Object, String> VERSION_ID_PK = new SimpleAttribute<Object, String>(
        "documentId") {
    public String getValue(Object object, QueryOptions queryOptions) {
        return (String) ((Bitemporal)object).getBitemporalStamp().getVersionId();
    }
};
```
POJOs get passed as `Bitemporal` proxies, thats why you can cast them to `Bitemporal` to get access to the Version information via the `BitemporalStamp` 
Then add the backbone collection to `BarbelHisto`.
```java
BarbelHisto<T> core = BarbelHistoBuilder.barbel().withBackboneSupplier(()->{
                    IndexedCollection<T> backbone = new ConcurrentIndexedCollection<T>();
                    backbone.addIndex((Index<T>) NavigableIndex.onAttribute(VERSION_ID_PK));
                    return backbone;
                    }).build();
```