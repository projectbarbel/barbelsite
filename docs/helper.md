---
id: helper
title: BarbelHisto as Helper Class
sidebar_label: Persistence Helper
---

The easiest way to use BarbelHisto is to integrate it as helper class for managing your persistent bi-temporal data. This alterantive is described in the [Spring Boot Application helper example](springboot.md).

The idea is that yuo use the return value of the `save()` operation, which is an instance of `BitemporalUpdate`. This instance contains all updates happended by the save operation. It is these updates that you need to store to your database.

Here is the service implementation that uses `BarbelHisto` as helper class for bi-temporal data.

```java
@Component
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public void saveCustomer(Customer customer, LocalDate from, LocalDate until) {

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

This is the minimal setup when you'd use `BarbelHisto`. In the example the service uses the `BitemporalUpdate`return value of the `save`-Operation to perform the updates to an underlying `MongoCollection`. There are two kinds of records returned in a `BitemporalUpdate`instance. 'Inactivations' are existing records that were inactivated by the considered update to `BarbelHisto`. 'Inserts' are new(!) active versions. Lets go through this step-by-step:

1. The service creates an instance of `BarbelHisto` in `BarbelMode.BITEMPORAL`
2. It loads the current active(!) records of the `Customer` journal to `BarbelHisto` (here journal with the clientId "1234").
3. Then the service performs the update against `BarbelHisto` helper instance. 

Notice, that step 3 causes some active records to be inactivated and new active records are created for the new effective periods. We need to forward those changes to the backend `MongoCollection` now. Currently, only the `BarbelHisto` helper knows about the changes. We can propagate the changes using the `BitemporalUpdate`return value of the `save`-operation.

4. First save inactivated records. The state of these existing(!) records changed. By performing a save operation the corresponding backend records are updated, i.e. inactivated.
5. As a last step, insert the new active records created by the bi-temporal update. An insert needs to be prepared. The new active records were copied from existing ones, therefore they carry a wrong ID in the `Customer.id` field. Before we insert these records into the `MongoCollection`, we need to clear the IDs. Afterwards records can be inserted as new records.

This is what you need to do in your service when you use `BarbelHisto` as helper in your backend services.
