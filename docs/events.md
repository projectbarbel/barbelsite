---
id: events
title: Using BarbelHisto events
sidebar_label: Using events
---
`BarbelHisto` provides an event mechanism to extend the core functionality. Clients can implement event handler methods to handle the events. Amongst other uses these event handlers can drive the integration with external data sources. The event mechanism is based on [Google Guavas](https://github.com/google/guava) `EventBus` implementation. 

Events are posted to synchronous and/or asynchronous `EventBus` instances. In case events are posted to synchronous and asynchronous event bus, they are refered to as posted 'both way'. Synchronous events are executed in the same thread issueing the event, which means that the handler methods listening to synchronous events execute synchronously. This can be usefull for many scenarios, like pre-fetching data in a lazy loading `BarbelHisto` instance. See [the persistence tutorial](persistence) for details.
## Event types
The following events are posted by `BarbelHisto`:
 1. `EventType.BARBELINITIALIZED` when `BarbelHisto` instance is created, only once per `BarbelHisto` session, both way.
 2. `EventType.INITIALIZEJOURNAL` when journal is created, only once per document journal creation, both way
 3. `EventType.ACQUIRELOCK`, when `BarbelHisto` starts updating a document journal, synchronous post
 4. `EventType.REPLACEBITEMPORAL`, when versions are inactivated, maybe multiple times in a single update operation, both way
 5. `EventType.INSERTBITEMPORAL`, when new versions are inserted, one time per update operation, both way
 6. `EventType.UPDATEFINISHED`, when the update operation for journal was completed, once per save operation, both way
 7. `EventType.RELEASELOCK`, when `BarbelHisto` finishes the updating cycle, synchronous post
 8. The `EventType.RETRIEVEDATA` event is posted each time when clients retrieve data from `BarbelHisto`.
 9. The `EventType.ONLOADOPERATION` event is posted each time when clients load data into `BarbelHisto` using the `load` operation.
 10. The `EventType.UNONLOADOPERATION` event is posted each time when clients unload data from `BarbelHisto` using the `unload` operation.

Events 2-7 are posted in exactly that order in an update operation performed by the `save()` method of `BarbelHisto`.
## Event handler methods
Listeners to these events are implemented as the following examples:
```java
public class UpdateEventListeners {
    @Subscribe
    public void handleInitialization(BarbelInitializedEvent event) {
        // ... handle event
    }
    @Subscribe
    public void handleInserts(InsertBitemporalEvent event) {
        // ... handle event
    }
    @Subscribe
    public void handleReplacements(ReplaceBitemporalEvent event) {
        // ... handle event
    }
}
@SuppressWarnings("unchecked")
public class LazyLoadingListener {
    @Subscribe
    public void handleRetrieveData(RetrieveDataEvent event) {
        // ... handle event
    }
    @Subscribe
    public void handleInitializeJournal(InitializeJournalEvent event) {
        // ... handle event
    }
}
```
Use the `@Subscribe` annotation to subscribe the handler method to the event declared as parameter. The event passed contains the `eventContext` that can be used to drive processing. It contains an instance of the `DocumentJournal` that was or will be updated and the like. Clients can use these context parameters to implement sophisticated event handling. The context data is always a copy of what originally happened, so clients cannot harm `BarbelHisto`s internal consistency.
## Register listeners
To put listener classes in action clients register instances of the listener classes with `BarbelHistoBuilder`. 
```java
BarbelHisto<DefaultDocument> core = BarbelHistoBuilder.barbel().withMode(BarbelMode.BITEMPORAL)
        .withSynchronousEventListener(new LazyLoadingListener()).build();
```
The above snippet shows a registration in the synchronous event bus. Registration with asynchronous bus works accordingly.
## Error handling
By default handler methods **fail silently**. This is because subsequent handler methods should still be executed when a previous handler fails. In synchronous scenarios, however, it can be very useful to stop processing if an event handler fails. Clients stop processing by setting the event passed into the handler method to `HistoEvent.failed()`. As a consequence, `BarbelHisto` will rollback any changes made to the instance in the running update operation and return an `HistoEventFailedException` to the client. Here is an example pattern of using the described error handling.
```java
public static class ShadowCollectionListeners {
    @Subscribe
    public void handleInserts(InsertBitemporalEvent event) {
        try {
            // some processing that may fail and client wants to handle that situation
        } catch (Exception e) {
            event.failed();
        }
    }
    @Subscribe
    public void handleReplacements(ReplaceBitemporalEvent event) {
        try {
            // some processing that may fail and client wants to handle that situation
        } catch (Exception e) {
            event.failed();
        }
    }
}
``` 
When an exception is thrown during processing of these event handlers, the event is set to failed, and `BarbelHisto` will throw an exception right after leaving the event handler.