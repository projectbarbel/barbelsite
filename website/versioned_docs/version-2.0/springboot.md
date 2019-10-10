---
id: version-2.0-springboot
title: BarbelHisto as service helper in Spring Boot
sidebar_label: Spring Boot helper example
original_id: springboot
---

The following example demonstrates how to use `BarbelHisto` in a Spring Boot application. There are two fundamental alternatives to integrate `BarbelHisto` into Spring Boot: using `BarbelHisto` as a helper class in your services, or you use `BarbelHisto` event listener persistence within Spring Boot services. This example demonstrates the simple helper class alternative.

The Spring Boot example application can be found [here in the examples repository](https://github.com/projectbarbel/barbelhisto-samples/tree/master/springboot-helper).

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
```
The `@Id` annotation is a spring annotation which uniquely identifies an object in the data source you use. We will use a MongoDB repository in this example. The `@DocumentId`  is a BarbelHisto annotation to identify the functional identifier of the business object. A certain customer is uniquely identified by his corresponding `clientId`.

Notice that we use `BarbelMode.BITEMPORAL` in this setup, so the `Customer` implements the `Bitemporal` interface.
The `BitemporalStamp` will contain the version data. When users of `BarbelHisto` use custom persistence it can be more convenient to use `BarbelHisto` in the `BarbelMode.BITEMPORAL`. No proxying magic will be applied to any objects. And objects are stored as they are, just with an additional `BitemporalStamp`. This mode is very explicit and straight forward.

## Spring boot conversion classes

We need two converters, cause Spring Boot is claiming conversion issues with `ZonedDateTime`.
Use converters like this one in your application:

```java
public class ZonedDateTimeReadConverter implements Converter<Date, ZonedDateTime> {
    @Override
    public ZonedDateTime convert(Date date) {
        return date.toInstant().atZone(ZoneOffset.UTC);
    }
}
public class ZonedDateTimeWriteConverter implements Converter<ZonedDateTime, Date> {
    @Override
    public Date convert(ZonedDateTime zonedDateTime) {
        return Date.from(zonedDateTime.toInstant());
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

## The CustomerService using a BarbelHisto helper

Here is the service implementation that uses `BarbelHisto` as helper class for bi-temporal data.

```java
@Component
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public void saveCustomer(Customer customer, ZonedDateTime from, ZonedDateTime until) {

        // (1) create BarbelHisto helper instance
        BarbelHisto<Customer> bitemporalHelper = BarbelHistoBuilder.barbel().withMode(BarbelMode.BITEMPORAL).build();

        // (2) load active records of the current Customer journal
        bitemporalHelper.load(customerRepository.findByClientIdAndBitemporalStampRecordTimeState(customer.getClientId(),
                BitemporalObjectState.ACTIVE));

        // (3) make a bitemporal update
        BitemporalUpdate<Customer> update = bitemporalHelper.save(customer, from, until);

        // (4) replace inactivated versions
        update.getInactivations().stream().forEach(i -> customerRepository.save(i));

        // (5) prepare inserts: clear IDs of new version records
        update.getInserts().stream().forEach(d -> d.setId(null));

        // (5) perform inserts of new version data
        customerRepository.insert(update.getInserts());

    }

}
```

This is the minimal setup when you'd use `BarbelHisto`. In the example the service uses the `BitemporalUpdate`return value of the `save`-Operation to perform the updates to the underlying `MongoCollection`. There are two kinds of records returned in a `BitemporalUpdate`instance. 'Inactivations' are existing records that were inactivated by the considered update to `BarbelHisto`. 'Inserts' are new(!) active versions. Lets go through this step-by-step:

1. The service creates an instance of `BarbelHisto` in `BarbelMode.BITEMPORAL`
2. It loads the current active(!) records of the `Customer` journal to `BarbelHisto` (here journal with the clientId "1234").
3. Then the service performs the update against `BarbelHisto` helper instance. 

Notice, that step 3 causes some active records to be inactivated and new active records are created for the new effective periods. We need to forward those changes to the backend `MongoCollection` now. Currently, only the `BarbelHisto` helper knows about the changes. We can propagate the changes using the `BitemporalUpdate`return value of the `save`-operation.

4. First save inactivated records. The state of these existing(!) records changed. By performing a save operation the corresponding backend records are updated, i.e. inactivated.
5. As a last step, insert the new active records created by the bi-temporal update. An insert needs to be prepared. The new active records were copied from existing ones, therefore they carry a wrong ID in the `Customer.id` field. Before we insert these records into the `MongoCollection`, we need to clear the IDs. Afterwards records can be inserted as new records.

This is what you need to do in your service when you use `BarbelHisto` as helper in your backend services.

## The Spring boot configuration

Let's look at the Spring Boot configuration to put all the above stuff together.

```java
@SpringBootApplication
public class BarbelHistoHelperIntegrationApplication extends MongoConfigurationSupport implements CommandLineRunner {

    @Autowired
    private CustomerService service;
    
    @Autowired
    private CustomerRepository repository;
    

    public static void main(String[] args) throws Exception {
	    SpringApplication.run(BarbelHistoHelperIntegrationApplication.class, args);
	}
	
    @Override
    protected String getDatabaseName() {
        return "test";
    }

    @Override
    public MongoCustomConversions customConversions() {
        final List<Converter<?, ?>> converters = new ArrayList<Converter<?, ?>>();
        converters.add(new ZonedDateTimeReadConverter());
        converters.add(new ZonedDateTimeWriteConverter());
        return new MongoCustomConversions(converters);
    }

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
This was a very fast way to get audit-proof bi-temporal data for any kind of data source.


