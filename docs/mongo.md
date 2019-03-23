---
id: mongo
title: Integrating MongoDB
sidebar_label: Integrating MongoDB
---

MongoDB can be integrated by using the supplied MongoDB event listeners from the `barbelhisto-persistence-mongo` package. Download the [MongoDB listeners on Maven Central](https://search.maven.org/search?q=a:barbelhisto-persistence-mongo).
 
[![Maven Central](https://img.shields.io/maven-central/v/org.projectbarbel/barbelhisto-persistence-mongo.svg)](https://search.maven.org/search?q=a:barbelhisto-persistence-mongo)

The mongo package is tested [MongoDB Java Driver](https://mongodb.github.io/mongo-java-driver/) 3.6.4

```
<dependency>
	<groupId>org.mongodb</groupId>
	<artifactId>mongodb-driver</artifactId>
	<version>3.6.4</version>
</dependency>
```

## Persistence listeners

To register the listeners to `BarbelHisto`:
 ```java
MongoClient mongoClient = SimpleMongoListenerClient.create("mongodb://localhost:12345").getMongoClient();
// update listener
SimpleMongoUpdateListener updateListener = SimpleMongoUpdateListener.create(mongoClient, "testDb", "testCol", Client.class, BarbelHistoContext.getDefaultGson());
// pre-fetch listener
SimpleMongoLazyLoadingListener loadingListener = SimpleMongoLazyLoadingListener.create(mongoClient, "testDb", "testCol", Client.class, BarbelHistoContext.getDefaultGson());
// BarbelHisto instance
BarbelHisto<Client> mongoBackedHisto = BarbelHistoBuilder.barbel().withSynchronousEventListener(updateListener)
                .withSynchronousEventListener(loadingListener).build();
 ```
The `BarbelHisto` instance will be pre-fetched with data as it is required on `retrieve` or `save` operations performed by the client. Also, the update listener will save new versions automatically to the defined `MongoCollection`.

Applications can define an instance of `BarbelHisto` as singleton, which increases performance. If you run in singleton context, use the `singletonContext` flag on the lazy loading listener.

```java
SimpleMongoLazyLoadingListener loadingListener = 
            SimpleMongoLazyLoadingListener.create(client.getMongoClient(), 
            "testSuiteDb", 
            "testCol", 
            managedType,
            BarbelHistoContext.getDefaultGson(), 
            true);
```
Further performance imporvements can be achieved when adding the update listeners to the asynchronous service bus (instead of the synchronous bus) when creating the `BarbelHisto`instance. However, this requires sensible attention to error handling and thread configuration, as usual in asynchronous processing setups.

The simple listener implementations provide support for all `BarbelQueries`. If you define custom queries against `BarbelHisto` include the `BarbelQueries.DOCUMENT_ID` as a filter criterion. Otherwise `BarbelHisto` may try to pre-fetch the complete data from the `MongoCollection`.

## Pessimistic locking
If you need multiple `BarbelHisto` instances access the document collection you can use the `MongoPessimisticLockingListener` to perform a pessimistic locking. This way it is impossible that two clients concurrently update a journal persisted in MongoDB. You can register the pessimistic locking listener to the synchronous service bus:
```java
SimpleMongoListenerClient client = SimpleMongoListenerClient.create("mongodb://localhost:12345");
SimpleMongoUpdateListener updateListener = SimpleMongoUpdateListener.create(client.getMongoClient(), "testDb", "testCol", managedType, BarbelHistoContext.getDefaultGson());
SimpleMongoLazyLoadingListener loadingListener = SimpleMongoLazyLoadingListener.create(client.getMongoClient(), "testDb", "testCol", managedType, BarbelHistoContext.getDefaultGson());
MongoPessimisticLockingListener lockingListener = MongoPessimisticLockingListener.create(client.getMongoClient(), "lockDb", "docLocks");
BarbelHisto<DefaultPojo> mongoBackedHisto = BarbelHistoBuilder.barbel().withSynchronousEventListener(updateListener)
                            .withSynchronousEventListener(loadingListener).withSynchronousEventListener(lockingListener);
```
In this setup it is possible to access the version data from mutliple instances of `BarbelHisto` at the same time.

