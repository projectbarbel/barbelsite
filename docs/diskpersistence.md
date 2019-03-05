---
id: diskpersistence
title: Using disk persistence
sidebar_label: Disk persistence
---

`BarbelHisto`is based on [CqEngine collections](https://github.com/npgall/cqengine). These collections can be stored persitent on disk. They use an [SQLite database](https://www.sqlite.org/index.html) to achieve this, so storing data to disk also provides transaction isolation. Refer to the [CqEngine documentation](https://github.com/npgall/cqengine) to go into details about all the option.

The code snipped below shows an example how to configure disk persistence with `BarbelHisto`.

```java
// define primary key in POJO class -> versionID !
SimpleAttribute<DefaultPojo, String> primaryKey = 
   new SimpleAttribute<DefaultPojo, String>("versionId") 
      {
        public String getValue(DefaultPojo object, QueryOptions queryOptions) {
            return (String) ((Bitemporal) object).getBitemporalStamp().getVersionId();
       };
// make BarbelHisto backbone persistent and register 
// Mongo update listener with asynchronous bus
BarbelHisto<DefaultPojo> histo = BarbelHistoBuilder.barbel()
        .withBackboneSupplier(() -> new ConcurrentIndexedCollection<>
            (
            DiskPersistence.onPrimaryKeyInFile(primaryKey, new File("test.dat"))
            );
```
First you need to define a `primaryKey`. The `versionId`should become the primary key. Then define a custom persistent backbone collection with `BarbelHistoBuilder.withBackboneSupplier`. Notice that you have to define a `Supplier` cause `BarbelHisto` decides when to construct the backbone collection. The `DefaultPojo` uses the `@PersistenceConfig` annotation on type level which is mandatory when ever you want to use `DiskPersistence` with `BarbelHisto`.
```java
@PersistenceConfig(serializer = BarbelPojoSerializer.class, polymorphic = true)
``` 
The annotation causes `BarbelHisto` to register a specific serializer with CqEngine collections to make sure that all the version data is stored correctly when using `BarbelMode.POJO`. IN `BarbelMode.BITEMPORAL`this annotation will not be required.