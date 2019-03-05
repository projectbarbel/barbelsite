---
id: performance
title: Configuring for Performance
sidebar_label: Performance setups
---

In the previous chapters we've used the lazy loading and update listeners to integrate a `MongoCollection` with the synchronous event bus. There are advantages and some drawbacks of this configuration, espacially in scenarios where high performance is one of the key requirements.

### Synchronous pros and cons

Registration with the synchronous service bus eases error handling, cause clients can react immediately when an exception is thrown in the listeners. On the other hand, synchronous means wating for response, which isn't always necessary, espacially with update operations.

### Complex queries

Also, the lazy loading listeners require the user to pass the journal ID to work properly. In some situations, this isn't enough. Clients want to define complex custom queries, that combine many attributes, but no document IDs. In fact these complex queries should have the document IDs as a result, not as a parameter. For instance, when an adress or client name is known, and the user needs to find the corresponding policy number (which is the document ID in many cases).

### Advanced performance setups

To adress the complex query and performance requirements you can configure `BarbelHisto` in advanced setups. One option is that you can resign lazy loading listeners. Instead, use disk persistent indexed collections as object query pool. At the same time you can register an update persistence listener to the asynchronous service bus. In such a setup, complex queries can be defined, and the data is still shadowed to a `MongoCollection` if required. But everything works much faster then in the synchronous scenarios. 

```java
// define primary key in POJO class -> versionID !
SimpleAttribute<DefaultPojo, String> primaryKey = 
   new SimpleAttribute<DefaultPojo, String>("versionId") 
      {
        public String getValue(DefaultPojo object, QueryOptions queryOptions) {
            return (String) ((Bitemporal) object).getBitemporalStamp().getVersionId();
       };
// define the update listener
SimpleMongoUpdateListener updateListener = SimpleMongoUpdateListener.create(client.getMongoClient(),
                            "testSuiteDb", "testCol", DefaultPojo.class, BarbelHistoContext.getDefaultGson());
// make BarbelHisto backbone persistent and register 
// Mongo update listener with asynchronous bus
BarbelHisto<DefaultPojo> histo = BarbelHistoBuilder.barbel()
        .withBackboneSupplier(() -> new ConcurrentIndexedCollection<>
            (
            DiskPersistence.onPrimaryKeyInFile(primaryKey, new File("test.dat"))
            )
        ).withAsynchronousEventListener(updateListener);
```
In a first step you define the primaryKey, which is mandatory when you use persistent disk space. Use the  versionId  as primary key as demonstrated above. Then define the update listener and register that with BarbelHistoBuilder . Also register a disk DiskPersistence  backbone using the builder. In the above example your data is kept in the  test.dat  file and also in the shadow MongoCollection.

Look into [this test case](https://github.com/projectbarbel/barbelhisto-persistence-mongo/blob/master/src/test/java/com/projectbarbel/histo/persistence/mongo/PerformanceSuiteTest.java) to see the complete scenario.