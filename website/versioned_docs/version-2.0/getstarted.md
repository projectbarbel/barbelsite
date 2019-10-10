---
id: version-2.0-getstarted
title: Get started with POJOs
sidebar_label: Get started with POJOs
original_id: getstarted
---

[See this test case](https://github.com/projectbarbel/barbelhisto-core/blob/master/src/test/java/org/projectbarbel/histo/BarbelHistoCore_StdPojoUsage_Test.java) to get the complete code for this tutorial.
> **NOTE**: in this turorial we use `BarbelHisto`s default processing mode, which is `BarbelMode.POJO`. There is another mode called `BarbelMode.BITEMPORAL` if proxying does not work out on your business classes. 

## Get the latest version
First, get your latest version of `BarbelHisto`:

<a href="https://search.maven.org/search?q=g:%22org.projectbarbel%22%20AND%20a:%22barbelhisto%22"><img src="https://img.shields.io/maven-central/v/org.projectbarbel/barbelhisto.svg?label=barbelhisto" align="left"/><br>

## Create an instance of BarbelHisto
Create an instance of `BarbelHisto`.
```java
BarbelHisto<Employee> core = BarbelHistoBuilder.barbel().build();
```

## Store and retrieve a version
You're ready to store instances of `Employee` to your `BarbelHisto` instance.
```java
Employee employee = new Employee("somePersonelNumber", "Martin", "Smith");
core.save(employee, ZonedDateTime.now(), EffectivePeriod.INFINITE);
```
In the `Employee.class` you need to specify the `@DocumentId` so that `BarbelHisto`can group versions to a document journal. In the `Employee.class` the `personnelNumber` is the document ID. 
```java
public static class Employee {
   @DocumentId
   private String personnelNumber; 
   private String firstname; 
   private String lastname;
   private List<Adress> adresses = new ArrayList<>();
   ... constructor and accessor methods
}
```
The document ID must be unique for the document from a business viewpoint. An employee can be uniquely identified by his personnel number. <br>
If you want to retrieve your current `Employee` version, you can do that by calling `retrieveOne`on `BarbelHisto`.
```java
Employee effectiveEmployeeVersion = core.retrieveOne(BarbelQueries.effectiveNow(employee.getId()));
```
Notice that you need to tell `BarbelHisto` what effective date your looking for. In the query above you're looking for the `Employee` version effective now (today). You can also ask for a specific date in the past or in the future.
```java
Employee effectiveIn10Days = core.retrieveOne(BarbelQueries.effectiveAt(employee.personnelNumber, ZonedDateTime.now().plusDays(10)));
```
That query retrieves the `Employee` version effective in ten days. It will return one, cause you've stored the `Employee` version to be effective from now to infinite (`EffectivePeriod.INFINITE`). If you retrieve the `Employee` effective yesterday you'll receive a `NoSuchElementException` claiming that no value can be found. This strict treatment is to avoid `NullPointerException` somewhere later in the process. However, this query throws an exception, cause nothing was effective yesterday:
```java
Employee effectiveYesterday = core.retrieveOne(BarbelQueries.effectiveAt(employee.personnelNumber, ZonedDateTime.now().minusDays(1)));
```
## Accessing bitemporal version metadata
Whenever you receive data from `BarbelHisto` with `retrieve`-methods all the objects carry a `BitemporalStamp` as version stamp. This stamp contains all the version data for that object. You can receive that as follows:
```java
BitemporalStamp versionData = ((Bitemporal)effectiveEmployeeVersion).getBitemporalStamp();
```
That `BitemporalStamp` contains the effective time and record time data for that given object.
> Casting is only required in `BarbelMode.POJO` as proxies are returned from the `BarbelHisto` instance. If you use `BarbelMode.BITEMPORAL` you get the `BitemporalStamp` by calling the `getBitemporalStamp()` method.
## Printing pretty journals
Let's look at a pretty print of a document journal for a document ID. The pretty print shows what `BarbelHisto` knows about your data. It prints out the version data of of the given document ID in a table format. 
```java
System.out.println(core.prettyPrintJournal(employee.getId()));
```
That prints the following to your console.

**NOTE: when I wrote this Readme.md it was 2019 February the 15th**

```
Document-ID: somePersonelNumber

|Version-ID                              |Effective-From |Effective-Until |State   |Created-By           |Created-At                                   |Inactivated-By       |Inactivated-At                               |Data                           |
|----------------------------------------|---------------|----------------|--------|---------------------|---------------------------------------------|---------------------|---------------------------------------------|-------------------------------|
|226ab05c-7c2d-4746-8861-18dc85a0188e    |2019-02-15     |999999999-12-31 |ACTIVE  |SYSTEM               |2019-02-15T08:46:56.495+01:00[Europe/Berlin] |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-02- |
```
You can change the pretty printer and write your own. Look into `TableJournalPrettyPrinter` to see how to write an individual printer. You can register that printer with `BarbelHistoBuilder`.
## Make a bitemporal update
So far you know how to store POJOs to `BarbelHisto`. The real power of `BarbelHisto` is, however, to store changes to your `Employee` that become effective in the future (or became effective in the past). Here is how simple such an update works.
Let's retrieve a copy of our current employee version. (**clients only ever retrieve copies!**)
```java
Employee effectiveEmployeeVersion = core.retrieveOne(BarbelQueries.effectiveNow(employee.getId()));
```
Now suppose that the employee marries in 10 days, and that is supposed to become the day when the last name has to change.
```java
effectiveEmployeeVersion.setLastname("changedLastName");
core.save(effectiveEmployeeVersion, ZonedDateTime.now().plusDays(10), EffectivePeriod.INFINITE);
```
Done. `BarbelHisto` now knows about that change, it will make a snapshot and store that internally. You could safely continue to work with your employee version and save that again later. <br>
If you retrieve versions now, you may become different states of the employee, since you've recorded a change.
```java
effectiveEmployeeVersion = core.retrieveOne(BarbelQueries.effectiveNow(employee.getId()));
effectiveIn10Days = core.retrieveOne(BarbelQueries.effectiveAt(employee.personnelNumber, ZonedDateTime.now().plusDays(10)));
assertTrue(effectiveEmployeeVersion.getLastname().equals("Smith"));
assertTrue(effectiveIn10Days.getLastname().equals("changedLastName"));
```
The `effectiveEmployeeVersion` is that version you've stored in the beginning of this tutorial, the `effectiveIn10Days` version will be the one with the changed last name. <br>
Let's also have a look at the pretty print of that journal now. Again call:
```java
System.out.println(core.prettyPrintJournal(employee.getId()));
```
That should return the following journal now.
```
Document-ID: somePersonelNumber

|Version-ID                              |Effective-From |Effective-Until |State   |Created-By           |Created-At                                   |Inactivated-By       |Inactivated-At                               |Data                           |
|----------------------------------------|---------------|----------------|--------|---------------------|---------------------------------------------|---------------------|---------------------------------------------|-------------------------------|
|226ab05c-7c2d-4746-8861-18dc85a0188e    |2019-02-15     |999999999-12-31 |INACTIVE|SYSTEM               |2019-02-15T08:46:56.495+01:00[Europe/Berlin] |SYSTEM               |2019-02-15T08:46:56.546+01:00[Europe/Berlin] |EffectivePeriod [from=2019-02- |
|c2d8a5b8-a8cf-4f19-aeb4-4ca61b4f8f70    |2019-02-15     |2019-02-25      |ACTIVE  |SYSTEM               |2019-02-15T08:46:56.541+01:00[Europe/Berlin] |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-02- |
|c9302f79-9c7b-4b4a-b011-8bb6177278af    |2019-02-25     |999999999-12-31 |ACTIVE  |SYSTEM               |2019-02-15T08:46:56.536+01:00[Europe/Berlin] |NOBODY               |2199-12-31T23:59:00Z                         |EffectivePeriod [from=2019-02- |
```
As you can see the journal of that employee now contains three versions. Two versions with `ACTIVE` state and one with `INACTIVE` state. The active versions are effective from 2019-02-15 (today) and effective from 2019-02-25. There is one inactivated version, the one you've stored in the beginning of that tutorial, effective from 2019-02-15 until `EffectivePeriod.INFINITE`. `BarbelHisto` manages two time dimensions, one reflects the effective time, and another one, redord time, reflects when a change was made. For that reason, **nothing will ever be deleted**. There are **only inserts** to `BarbelHiso` backbone collections, **never deletions**. 
