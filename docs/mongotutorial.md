---
id: mongotutorial
title: Setting up MongoDB in 5 minutes
sidebar_label: MongoDB tutorial
---
If you want to make MongoDB work with `BarbelHisto` you need two maven dependencies to get started.


<a href="https://search.maven.org/search?q=g:%22org.projectbarbel%22%20AND%20a:%22barbelhisto%22"><img src="https://img.shields.io/maven-central/v/org.projectbarbel/barbelhisto.svg?label=Maven%20Central" align="left">BarbelHisto core</a>
<br>
<a href="https://search.maven.org/search?q=g:%22org.projectbarbel%22%20AND%20a:%22barbelhisto-persistence-mongo%22"><img src="https://img.shields.io/maven-central/v/org.projectbarbel/barbelhisto-persistence-mongo.svg?label=Maven%20Central" align="left">Mongo persistence listeners</a>

You nee the [MongoDB Java Driver](https://mongodb.github.io/mongo-java-driver/) 3.10.1 or higher.

```
<dependency>
	<groupId>org.mongodb</groupId>
	<artifactId>mongodb-driver-sync</artifactId>
	<version>3.10.1</version>
	<scope>provided</scope>
</dependency>
```

Develop a Pojo, like this one:
```java
public class Client {

    @DocumentId
    private String clientId;
    private String title;
    private String name;
    private String firstname;
    private String address;
    private String email;
    private LocalDate dateOfBirth;

}
```
Notice that we use the `@DocumentId` annotation to tell `BarbelHisto` that the `clientId` uniquely identifies the client and this should be the document id. `BarbelHisto` will maintain document journals for each document id.

Now, create an instance of `BarbelHisto` with mongo collection shadows like so:
```java
MongoClient mongoClient = SimpleMongoListenerClient.create("mongodb://localhost:12345").getMongoClient();
// update listener
SimpleMongoUpdateListener updateListener = SimpleMongoUpdateListener.create(mongoClient, "testDb", "testCol", Client.class, BarbelHistoContext.getDefaultGson());
// pre-fetch listener
SimpleMongoLazyLoadingListener loadingListener = SimpleMongoLazyLoadingListener.create(mongoClient, "testDb", "testCol", Client.class, BarbelHistoContext.getDefaultGson());
// locking listener
MongoPessimisticLockingListener lockingListener = MongoPessimisticLockingListener.create(mongoClient, "lockDb", "docLocks");
// BarbelHisto instance
BarbelHisto<Client> mongoBackedHisto = BarbelHistoBuilder.barbel().withSynchronousEventListener(updateListener)
                .withSynchronousEventListener(loadingListener).withSynchronousEventListener(lockingListener).build();
```
You can use your own `MongoClient` settings if you like. The `BarbelHisto` mongo package does provide a client creation class, for convenience. There are three listeners registered synchronously with `BarbelHisto`. The `SimpleMongoUpdateListener` will forward updates saved against `BarbelHisto` gagainst the mongo shadow collection. The `SimpleMongoLazyLoadingListener` listener ensures that data is fetched into the local `BarbelHisto` instance if cllients perform queries using the `BarbelHisto.retrieve()` methods. The `MongoPessimisticLockingListener` will lock journals in mongo, if the client performs an update using the `BarbelHisto.save()`. 

With this setup you can now store and retrieve bitemporal data with a mongo collection as data source.
```java
Client client = new Client("1234", "Mr.", "Smith", "Martin", "some street 11", "somemail@projectbarbel.org", LocalDate.of(1973, 6, 20));
mongoBackedHisto.save(client, LocalDate.now(), LocalDate.MAX);
```  
Later in other sessions of your web application, you can retrieve the client using the `BarbelHisto.retrieve()` from MongoDB.
```java
Client client = mongoBackedHisto.retrieveOne(BarbelQueries.effectiveNow("1234"));
```  
Use the `BarbelQueries` to make queries against the MongoDB backed `BarbelHisto` instance. You can also combine `BarbelQueries`.
```java
List<Client> clients = mongoBackedHisto.retrieve(QueryFactory.and(BarbelQueries.effectiveNow("1234"),BarbelQueries.effectiveNow("1234")));
```  
Be careful if you don`t specify IDs in your query. This might cause a full load of the mongo collection.

That's it. There is nothing more to do then this. 

Let's access the version data for the client object we've just added. You've retrieved the `client`previously in this tutorial.
```java
Bitemporal clientBitemporal = (Bitemporal)client;
System.out.println(clientBitemporal.getBitemporalStamp().toString());
```
If you like to print out what MongoDB knows about your client, then pretty print the document journal like so:
```java
System.out.println(mongoBackedHisto.prettyPrintJournal("1234"));
```
This yould return a printout that looks similar to this one:
````
Document-ID: 1234

|Version-ID                              |Effective-From |Effective-Until |State   |Created-By           |Created-At                                   |Inactivated-By       |Inactivated-At                               |Data                           |
|----------------------------------------|---------------|----------------|--------|---------------------|---------------------------------------------|---------------------|---------------------------------------------|-------------------------------|
|d18cd394-aa62-429b-a23d-46e935f80e71    |2019-03-01     |999999999-12-31 |ACTIVE  |SYSTEM               |2019-03-01T10:46:27.236+01:00[Europe/Berlin] |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-03- |
````

You can get the complete code from this tutorial in [this test case](https://github.com/projectbarbel/barbelhisto-persistence-mongo/blob/master/src/test/java/com/projectbarbel/histo/persistence/mongo/IntegratingMongo_Tutorial_DZone.java).