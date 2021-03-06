---
id: version-1.5.5-mongo
title: MongoDB integration
sidebar_label: Integrating MongoDB
original_id: mongo
---

MongoDB can be integrated by using the supplied MongoDB listeners from the `barbelhisto-persistence-mongo` package. Download the [MongoDB listeners on Maven Central](https://search.maven.org/search?q=a:barbelhisto-persistence-mongo).
 
[![Maven Central](https://img.shields.io/maven-central/v/org.projectbarbel/barbelhisto-persistence-mongo.svg)](https://search.maven.org/search?q=a:barbelhisto-persistence-mongo)

To register the listeners to `BarbelHisto`:
 ```java
SimpleMongoListenerClient client = SimpleMongoListenerClient.create("mongodb://localhost:12345");
SimpleMongoLazyLoadingListener lazyloader = SimpleMongoLazyLoadingListener.create(client.getMongoClient(), "testDb", "testCol", DefaultPojo.class, BarbelHistoContext.getDefaultGson());
BarbelHisto<DefaultPojo> lazyHisto = BarbelHistoBuilder.barbel().withSynchronousEventListener(lazyloader).build();
 ```
To use `BarbelHisto` in conjunction with the listeners, applications should define an instance of `BarbelHisto` as singleton in their application. The singleton instance will be pre-fetched with data as it is required on `retrieve` or `save` operations performed by the client. Also, the listeners will save new versions automatically to the defined `MongoCollection`.

The simple listener implementations do not lock a document journal in the database. Therefore clients want to create a `BarbelHisto` singleton instance to ensure locking is performed properly on a document journal level. The simple listener implementations provide support for all `BarbelQueries`. If you define custom queries against `BarbelHisto` include the `BarbelQueries.DOCUMENT_ID` as a filter criterion.