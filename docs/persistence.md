---
id: persistence
title: Adding persistence
sidebar_label: Adding persistence
---
In `BarbelHisto` there are three flavors of persistence, you can choose the CqEngine persistence options, persistence integration using events, or you choose a custom persistence.
## CqEngine built-in persistence
`BarbelHisto` is based on [CqEngine collections](https://github.com/npgall/cqengine) so clients can use any persistence options currently available in CqEngine. The default persistence of `BarbelHisto` is `OnHeapPersistence`. To change that you add a custom backbone collection. If you want to add `DiskPersistence` you'd need to define the primary key attribute as described in the CqEngine documentation:
```java
final SimpleAttribute<PrimitivePrivatePojo, String> PRIMARY_KEY = new SimpleAttribute<PrimitivePrivatePojo, String>("versionId") {
    public String getValue(PrimitivePrivatePojo object, QueryOptions queryOptions) {
        return (String) ((Bitemporal)object).getBitemporalStamp().getVersionId();
    }
};
```
POJOs get passed as `Bitemporal` proxies, that's why you can cast them to `Bitemporal` to get access to the version id via the `BitemporalStamp`. In this example we use a standard POJO `PrimitivePrivatePojo` annotated with the `@DocumentId` and `@PersistenceConfig` annotation. 
```java
@PersistenceConfig(serializer=BarbelPojoSerializer.class, polymorphic=true)
public class PrimitivePrivatePojo {
	@DocumentId
	public String id;
	public boolean someBoolean;
	public byte somByte;
	public short someShort;
	public char someChar;
	public int someInt;
	public float someFloat;
	public long someLong;
	public double someDouble;
}
```
The `@PersistenceConfig` annotation is mandatory for the disk persistence to function properly with CGLib proxies when using `BarbelMode.POJO`. In `BarbelMode.BITEMPORAL` this annotation is not required.

The field definition `PRIMARY_KEY` returns the version id as primary key for the persistence index. Now, create a persistent collection with `BarbelHisto` using the standard CqEngine API and `BarbelHistoBuilder`: 
```java
BarbelHisto<PrimitivePrivatePojo> core = BarbelHistoBuilder.barbel() .withBackboneSupplier(
                  ()-> new ConcurrentIndexedCollection<PrimitivePrivatePojo>(DiskPersistence.
                       onPrimaryKeyInFile(PRIMARY_KEY, new File("data.dat"))))
                  .build();
```
See the [CqEngine documentation](https://github.com/npgall/cqengine) on all the options you can choose. 
## Event-based persistence
`BarbelHisto` provides a sophisticated event mechanism to synchronize the backbone version data with external data sources. Events are posted on initialization tasks and data updates. Clients can register listeners for events and connect external data sources through the listeners. This enables  synchronization with an external data source. In the following examples we describe what you need to achieve this kind of persistence integration. 
> For educational reasons we use a simple indexed collection as external source. This can obviously be replaced with any external source you like. See [this testcase](https://github.com/projectbarbel/barbelhisto-core/blob/master/src/test/java/org/projectbarbel/histo/BarbelHistoCore_ShadowCollectionPersistence.java) for the complete code of this example. 

> The example uses `BarbelMode.BITEMPORAL` because these objects can be stored straight into the external data source. When clients use `BarbelMode.POJO` they deal with proxies and have to convert those objects into straight pojos appropriate for data storage and retrieval.
### Shadow data source
For educational reasons we suppose our external source is an ordinary `IndexedCollection` like this one:
```java
private static IndexedCollection<DefaultDocument> shadow;
``` 
To connect the backbone and mirror the data into a custom external data source (here the `shadow` collection), clients create listener methods. Our first method initializes the `shadow` collection:
```java
@Subscribe
public void handleInitialization(BarbelInitializedEvent event{
    shadow = new ConcurrentIndexedCollection<>();
}
```
All listener methods need to be annotated with `@Subscribe`. The following listener method listens to inserts and replacements of data in the `BarbelHisto` backbone:
```java
@Subscribe
public void handleInserts(UpdateFinishedEvent event{
    @SuppressWarnings("unchecked")
    List<Bitemporal> inserts = (List<Bitemporal>event.getEventContext()
            .get(UpdateFinishedEvent.NEWVERSIONS);
    inserts.stream().forEach(v -> shadow.ad(DefaultDocument) v));
    @SuppressWarnings("unchecked")
    Set<Replacement> replacements (Set<Replacement>) event.getEventContext()
            .get(UpdateFinishedEvent.REPLACEMENTS);
    replacements.stream().flatM(r->r.getObjectsAdded().stream()).forEach(v -shadow.add((DefaultDocument) v));
    replacements.stream().flatM(r->r.getObjectsRemoved().stream()).forEach(v -shadow.remove((DefaultDocument) v));
}
```
The handler method extracts the data from the event context and drop that into (or remove them from) the `shadow` collection. Notice that each handler method is annotated with the `@Subscribe` annotation and then takes the specific event as parameter. For a complete list of events see `EventType`. Next, clients register their listeners, i.e. the classes containing listener methods, to their `BarbelHisto` instance like so:
```java
BarbelHisto<DefaultDocument> barbel = BarbelHistoBuilder.barbel().withMode(BarbelMode.BITEMPORAL)
        .withSynchronousEventListener(new ShadowCollectionListener()).build();
```
When you save objects to `BarbelHisto` the `shadow` collection will now contain a complete copy of the backbone, since all changes are mirrored into the shadow data source. 
> To improve performance on write operations considerably it's also possible to register the described **update** listeners with the **asynchronous** event bus. This would, however, also require some more sophisticated error handling to ensure data integrity.

Let's save a document and make a change to that document to see that all these versions indeed reach the shadow collection:
```java
DefaultDocument pojo = new DefaultDocument("someId", BitemporalStamp.createActive("someId")"some data");
barbel.save(pojo, LocalDate.now(), LocalDate.MAX);
assertEquals(1, shadow.size());
pojo.setData("some changes");
barbel.save(pojo, LocalDate.now().plusDays(2), LocalDate.MAX);
assertEquals(3, shadow.size());
```
The asserts prove that the `shadow` collection contains the versions you've created in `BarbelHisto`.
> **Notice** that we used `BarbelMode.BITEMPORAL` in this example. If you'd use `BarbelMode.POJO` (the default) the shadow collection contains proxy objects. You may want to cast these objects to `BarbelProxy` to access the target pojo, or to `Bitemporal` to access the version data. 
### Lazy loading external data
The next step to complete integration of external data sources using events would be to lazy load data from these data sources that were shadowed in previous `BarbelHisto`sessions. 
> Again, see [this testcase](https://github.com/projectbarbel/barbelhisto-core/blob/master/src/test/java/org/projectbarbel/histo/BarbelHistoCore_ShadowCollectionPersistence.java) for the complete code of the following examples. 

To remember, for educational reasons, our external source is an arbitrary `IndexedCollection`:
```java
private static IndexedCollection<DefaultDocument> shadow;
```
Here comes the first example listener method implementation for the `RetrieveDataEvent` posted by `BarbelHisto` when clients request data:
```java
@Subscribe
public void handleRetrieveData(RetrieveDataEvent event) {
    Query<DefaultDocument> query = (Query<DefaultDocument>) event.getEventContext()
            .get(RetrieveDataEvent.QUERY);
    BarbelHisto<DefaultDocument> histo = (BarbelHisto<DefaultDocument>) event.getEventConte()
            .get(RetrieveDataEvent.BARBEL);
    if (query instanceof Equal) {
        final String id = (String) ((Equal) query).getValue();
        List<Bitemporal> docs = shadow.stream()
                .filter(v -> v.getId().equals(id)).collect(Collectors.toList());
        histo.load(docs);
    }
}
```
The listener method looks into the `Query` posted by the client to get the document id value and then pre-fetches the version data for this document id into `BarbelHisto` using the `BarbelHisto.load` method. This is the most common way for pre-fetching: by document id. We're almost done now. When you'd use lazy loading you need another listener for the cases where the client wants to save new versions for document id journals not previosly fetched into `BarbelHisto`. This listener must listen to the `InitializeJournalEvent` event. Here is the example:
```java
@Subscribe
public void handleInitializeJournal(InitializeJournalEvent event) {
    DocumentJournal journal = (DocumentJournal)event.getEventContext().g(DocumentJournal.class);
    BarbelHisto<DefaultDocument> histo = (BarbelHisto<DefaultDocument>) event.getEventConte()
            .get(RetrieveDataEvent.BARBEL);
    List<Bitemporal> docs = shadow.stream()
            .filter(v -> v.getId().equals(journal.getId())).collect(Collectors.toList());
    histo.load(docs);
}
```
This listener draws the document journal for the document id from the external source and loads the version data into the barbel histo instance **before** the new version will be saved. 

With these listener methods implemented in the previous examples you will be able to lazy load and mirror back data from and to the external sources. If you'd use remote external sources you would replace the shadow collection with the `Mongo` collection or the like.

Last not least define a `BarbelHisto` instance, register the lazy loading listeners and make a query against the empty `BarbelHisto` instance:
```java
// retrieve data from BarbelHisto, which is empty at this point
BarbelHisto<DefaultDocument> core = BarbelHistoBuilder.barbel.withMode(BarbelMode.BITEMPORAL)
        .withSynchronousEventListener(new LazyLoadingListener).build();
List<DefaultDocument> docs = core.retrieve(BarbelQueries.all("someId"));

// will contain the data from lazy loading event handler
assertEquals(3, docs.size());
// only someId was loaded
assertEquals(3, ((BarbelHistoCore<DefaultDocument>)core).size);
```
The asserts prove that you've just retrieved data from a brand new `BarbelHisto` insance. This magic works due to the listeners implemented before. The data of the document id `someId` was lazy loaded into `BarbelHisto`. 
> Note that lazy loading always requires to register the listeners to the **>synchronous<** event bus. 
###  Error handling
With synchronous event listeners it's possible to implement an error handling that ensures data integrity in case of any errors in the event handlers. By default event listeners fail silently. This is because subsequent handlers should not be harmed when one handler fails. However, you can change that behavior for **synchronous** listeners by calling the `HistoEvent.failed()`. This will produce a `HistoEventFailedException` when the control returns to `BarbelHisto`.
```java
@Subscribe
public void handleInserts(InsertBitemporalEvent event) {
    try {
        // some processing logic that might fail
    } catch (Exception e) {
        event.failed();
    }
}
```
When the event was set to failed `BarbelHisto` will roll back the changes made during this update opration. This will ensure data integrity in such situations.
## Custom persistence
When you want to use other custom persistence alternatives as the ones we've described previously then `BarbelHisto` can export the backbone version data of a given document ID by calling the `BarbelHisto.unload()` and `BarbelHisto.load()` methods. Let's say you've created the data with `BarbelHisto`, then you export the data like so:
```java
Collection<Bitemporal> unload = core.unload("somePersonelNumber");
```
Notice that an unload removes that versions from the backbone collection. You can now store the complete version data for that given document ID to a data store of your choice. Later you can call `BarbelHisto.load()` to restore the `BarbelHisto` instance state for the document ID. If the version data of a given document ID is restored, clients can continue to post updates for that document ID. 
```java
Collection<Bitemporal> versionData = // ... some custom persistence service here that draws 
                                     //     the version data for 'somePersonelNumber' from the data store!
core.load(versionData);
```
The `BarbelHisto` instance must not contain any of the version data for the document IDs you try to load, otherwise you receive errors. This was made to ensure consistency of the version data.
