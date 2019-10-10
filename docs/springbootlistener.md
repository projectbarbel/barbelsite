---
id: springbootlistener
title: BarbelHisto in Spring Boot using event-driven persistence
sidebar_label: Spring Boot listener example
---

The following example demonstrates how to use `BarbelHisto` in a Spring Boot application. There are two fundamental alternatives to integrate `BarbelHisto` into Spring Boot: using `BarbelHisto` as a helper class in your services, or you use `BarbelHisto` event listener persistence within Spring Boot services. This example demonstrates the event listener alternative.

The Spring Boot example application can be found [here in the examples repository](https://github.com/projectbarbel/barbelhisto-samples/tree/master/springboot-listener).

## Customer Model

Here is the `Customer` POJO used in the subsequent examples.

```java
public class Customer implements Bitemporal {

    @Id
    private String id;
    
	@DocumentId
	private String clientId;
	
	// version stamp
	private BitemporalStamp bitemporalStamp;
	
	private String firstName;
	private String lastName;
	private String street;
	private String city;
	private String postalcode;

    // constructor and accessors ...

}    
````
The `@Id` annotation is a spring annotation which uniquely identifies an object in the data source you use. We will use a MongoDB repository in this example. The `@DocumentId`  is a BarbelHisto annotation to identify the functional identifier of the business object. A certain customer is uniquely identified by his corresponding `clientId`.

Notice that we use `BarbelMode.BITEMPORAL` in this setup, so the `Customer` implements the `Bitemporal` interface.
The `BitemporalStamp` will contain the version data. When users of `BarbelHisto` use custom persistence it can be more convenient to use `BarbelHisto` in the `BarbelMode.BITEMPORAL`. No proxying magic will be applied to any objects. And objects are stored as they are, just with an additional `BitemporalStamp`. This mode is very explicit and straight forward.

## Spring boot conversion classes

We need a converter for reading `Customer` objects previously stored by the event listeners.

```java
public class CustomerReadConverter implements Converter<Document, Customer>{

    private Gson gson = BarbelHistoContext.getDefaultGson();
    @Override
    public Customer convert(Document source) {
        return gson.fromJson(source.toJson(), Customer.class);
    }

}
```
We demonstrate how to register these converters in Spring Boot later.

## The CustomerRepository

In the example we're using a mongo repository like this one:

```java
public interface CustomerRepository extends MongoRepository<Customer, String> {

	public List<Customer> findByLastName(String lastName);
	
	public List<Bitemporal> findByClientId(String clientId);
	
	public List<Bitemporal> findByClientIdAndBitemporalStampRecordTimeState(String clientId, BitemporalObjectState state);
	
}
```

The method `findByClientId` draws the complete version data for a given `clientId`.
The `findByClientIdAndBitemporalStampRecordTimeState` draws active or inactive versions using the `BitemporalStamp` we've applied to the `Customer` object.

## The CustomerService using a BarbelHisto instance

Here is the service implementation that uses `BarbelHisto` with event-driven persistence.

```java
@Component
public class CustomerService {

    @Autowired
    private BarbelHisto<Customer> barbel;

    public void saveCustomer(Customer customer, ZonedDateTime from, ZonedDateTime until) {

        barbel.save(customer, from, until);

    }

}
```

The service autowires the barbel and uses it to store the data into the underlying `MongoCollection`.

## The Spring boot configuration

Let's look at the Spring Boot configuration to put all the above stuff together.

```java
@SpringBootApplication
public class BarbelHistoListenerIntegrationApplication extends MongoConfigurationSupport implements CommandLineRunner {

    @Autowired
    private CustomerService service;
    
    @Autowired
    private CustomerRepository repository;

    @Bean
    public BarbelHisto<Customer> barbel(MongoClient client) {
        SimpleMongoUpdateListener updateListener = SimpleMongoUpdateListener.create(
                client, "test", "customer", Customer.class,
                BarbelHistoContext.getDefaultGson());
        SimpleMongoLazyLoadingListener loadingListener = SimpleMongoLazyLoadingListener.create(
                client, "test", "customer", Customer.class,
                BarbelHistoContext.getDefaultGson(), true, true);
        MongoPessimisticLockingListener locking = MongoPessimisticLockingListener
                .create(client, "tsLockDb", "docLocks");
        return BarbelHistoBuilder.barbel().withMode(BarbelMode.BITEMPORAL).withSynchronousEventListener(updateListener)
                .withSynchronousEventListener(loadingListener).withSynchronousEventListener(locking).build();
    }

    public static void main(String[] args) throws Exception {
	    SpringApplication.run(BarbelHistoListenerIntegrationApplication.class, args);
	}
	
    @Override
    protected String getDatabaseName() {
        return "test";
    }

    @Override
    public MongoCustomConversions customConversions() {
        final List<Converter<?, ?>> converters = new ArrayList<Converter<?, ?>>();
        converters.add(new CustomerReadConverter());
        return new MongoCustomConversions(converters);
    }

	@Override
	@Override
    public void run(String... args) throws Exception {

	    Customer customer = new Customer("1234", "Alice", "Smith", "Some Street 10", "Houston", "77001");
	    
        // save a couple of customers
	    service.saveCustomer(customer, ZonedDateTime.now(), EffectivePeriod.INFINITE);
	    service.saveCustomer(customer, ZonedDateTime.now().plusDays(10), EffectivePeriod.INFINITE);
	    service.saveCustomer(customer, ZonedDateTime.now().plusDays(20), EffectivePeriod.INFINITE);
	    
        // validate the state of the journal
	    Assert.isTrue(repository.findByClientIdAndBitemporalStampRecordTimeState("1234", BitemporalObjectState.ACTIVE).size() == 3, "must contain 3 active records");
	    Assert.isTrue(repository.findByClientIdAndBitemporalStampRecordTimeState("1234", BitemporalObjectState.INACTIVE).size() == 2, "must contain 2 inactive records");

	    service.saveCustomer(customer, ZonedDateTime.now().minusDays(1), EffectivePeriod.INFINITE);
	    
	    // validate the state of the journal
        Assert.isTrue(repository.findByClientIdAndBitemporalStampRecordTimeState("1234", BitemporalObjectState.ACTIVE).size() == 1, "must contain 1 active records");
        Assert.isTrue(repository.findByClientIdAndBitemporalStampRecordTimeState("1234", BitemporalObjectState.INACTIVE).size() == 5, "must contain 5 inactive records");
	    
	    System.out.println(repository.findAll().toString());
    }
}
```
Notice that the `run` method performs some updates using the `CustomerService` just as demo here.
